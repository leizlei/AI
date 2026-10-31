import { Platform } from 'react-native';
import * as RNFS from '@dr.pogodin/react-native-fs';
import { initWhisper } from 'whisper.rn';
import { ASR_MODEL_VERSION, ASR_PARENT_SUBDIR, ASR_TIERS, ASR_VERSION_SENTINEL_FILENAME, } from '../../constants';
// Whisper writes non-speech as bracketed tags such as "[Music]",
// "[BLANK_AUDIO]" or "(music)", and whisper.rn has no option to suppress them.
const NON_SPEECH_TAG = /\[[^\]]*\]|\([^)]*\)/g;
function stripNonSpeechTags(text) {
    return text.replace(NON_SPEECH_TAG, ' ').replace(/\s+/g, ' ').trim();
}
/**
 * Whisper ASR engine (whisper.rn / whisper.cpp GGML models).
 *
 * Each tier (`base`/`small`/`large-turbo`) is an independent on-disk install
 * under `asr/<tier>/`, with its own version sentinel written as the final
 * download step so an interrupted download never reports installed. Install
 * truth lives on disk; no store flag mirrors it.
 *
 * Transcription runs entirely on-device: `initWhisper` loads the local GGML
 * model and `transcribeData` decodes a captured PCM buffer. The only network
 * call in this engine is the HuggingFace model download in `downloadModel`.
 */
export class WhisperAsrEngine {
    constructor() {
        this.context = null;
        this.loadedTier = null;
        this.loading = null;
        // Bumped by release(); a load that finishes after a release frees its
        // context instead of keeping it.
        this.generation = 0;
        this.stopTranscription = null;
        this.inFlight = null;
    }
    getRoot() {
        return Platform.OS === 'ios'
            ? `${RNFS.LibraryDirectoryPath}/Application Support`
            : RNFS.DocumentDirectoryPath;
    }
    getParentDir() {
        return `${this.getRoot()}/${ASR_PARENT_SUBDIR}`;
    }
    getTierDir(tier) {
        return `${this.getParentDir()}/${tier}`;
    }
    getModelPath(tier) {
        return `${this.getTierDir(tier)}/${ASR_TIERS[tier].modelFilename}`;
    }
    getSentinelPath(tier) {
        return `${this.getTierDir(tier)}/${ASR_VERSION_SENTINEL_FILENAME}`;
    }
    async isInstalled(tier) {
        try {
            if (!(await RNFS.exists(this.getModelPath(tier)))) {
                return false;
            }
            return this.isSentinelAtCurrentVersion(tier);
        }
        catch (err) {
            console.warn('[WhisperAsrEngine] isInstalled check failed:', err);
            return false;
        }
    }
    async isSentinelAtCurrentVersion(tier) {
        try {
            const sentinelPath = this.getSentinelPath(tier);
            if (!(await RNFS.exists(sentinelPath))) {
                return false;
            }
            const raw = await RNFS.readFile(sentinelPath);
            const parsed = JSON.parse(raw);
            return parsed.version === ASR_MODEL_VERSION;
        }
        catch (err) {
            console.warn('[WhisperAsrEngine] sentinel check failed:', err);
            return false;
        }
    }
    async reclaimLegacySpace(tier) {
        if (await this.isSentinelAtCurrentVersion(tier)) {
            return;
        }
        const tierDir = this.getTierDir(tier);
        if (await RNFS.exists(tierDir)) {
            await RNFS.unlink(tierDir).catch(() => { });
        }
    }
    async downloadModel(tier, onProgress) {
        const manifest = ASR_TIERS[tier];
        const parentDir = this.getParentDir();
        const tierDir = this.getTierDir(tier);
        // Create parent `asr/` with iOS backup exclusion, then the tier dir.
        // RNFS ignores NSURLIsExcludedFromBackupKey on Android; the Android
        // exclusion lives in backup_rules XML.
        await RNFS.mkdir(parentDir, { NSURLIsExcludedFromBackupKey: true });
        await RNFS.mkdir(tierDir, { NSURLIsExcludedFromBackupKey: true });
        try {
            const result = await RNFS.downloadFile({
                fromUrl: manifest.modelUrl,
                toFile: this.getModelPath(tier),
                background: false,
                discretionary: false,
                cacheable: false,
                progressInterval: 500,
                progress: res => {
                    if (!onProgress) {
                        return;
                    }
                    const contentLength = res.contentLength || manifest.estimatedBytes;
                    onProgress(Math.min(1, res.bytesWritten / contentLength));
                },
            }).promise;
            if (result.statusCode !== 200) {
                throw new Error(`Failed to download ${manifest.modelFilename}: HTTP ${result.statusCode}`);
            }
            // Version sentinel is the FINAL disk write: if the process is killed
            // before this, isInstalled() reports false and the download is cleanly
            // redone — an interrupted install never looks installed.
            await RNFS.writeFile(this.getSentinelPath(tier), JSON.stringify({ version: ASR_MODEL_VERSION }));
            onProgress?.(1);
        }
        catch (err) {
            try {
                if (await RNFS.exists(tierDir)) {
                    await RNFS.unlink(tierDir);
                }
            }
            catch (cleanupErr) {
                console.warn('[WhisperAsrEngine] partial-download cleanup failed:', cleanupErr);
            }
            throw err;
        }
    }
    async deleteModel(tier) {
        try {
            if (this.loadedTier === tier) {
                await this.release();
            }
            const tierDir = this.getTierDir(tier);
            if (await RNFS.exists(tierDir)) {
                await RNFS.unlink(tierDir);
            }
        }
        catch (err) {
            console.warn('[WhisperAsrEngine] deleteModel failed:', err);
        }
    }
    ensureContext(tier) {
        if (this.context && this.loadedTier === tier) {
            return Promise.resolve(this.context);
        }
        if (this.loading?.tier === tier) {
            return this.loading.promise;
        }
        const previous = this.loading?.promise;
        const generation = this.generation;
        const promise = (async () => {
            await previous?.catch(() => { });
            await this.releaseContext();
            const context = await initWhisper({
                filePath: this.getModelPath(tier),
                // CoreML sidecar is an optional accelerator; absence degrades to the
                // GGUF CPU path. Falling back to CPU never blocks transcription.
                useCoreMLIos: Platform.OS === 'ios',
            });
            if (generation !== this.generation) {
                await context.release().catch(() => { });
                throw new Error('ASR context released while loading');
            }
            this.context = context;
            this.loadedTier = tier;
            return context;
        })();
        const loading = { tier, promise };
        this.loading = loading;
        promise
            .finally(() => {
            if (this.loading === loading) {
                this.loading = null;
            }
        })
            .catch(() => { });
        return promise;
    }
    /** Loads the `tier` context ahead of the first transcription. */
    async preload(tier) {
        await this.ensureContext(tier);
    }
    async transcribe(pcmBase64Int16, opts) {
        const { tier } = opts;
        if (!(await this.isInstalled(tier))) {
            throw new Error(`ASR model not installed for tier ${tier}`);
        }
        const context = await this.ensureContext(tier);
        // transcribeData decodes the buffer as signed 16-bit PCM, whatever
        // whisper.rn's own doc comment says.
        const { stop, promise } = context.transcribeData(pcmBase64Int16, {
            language: opts.language ?? 'auto',
            prompt: opts.prompt,
        });
        this.stopTranscription = stop;
        this.inFlight = promise;
        try {
            const result = await promise;
            return result.isAborted
                ? { text: '', language: '' }
                : {
                    text: stripNonSpeechTags(result.result),
                    language: result.language ?? '',
                };
        }
        finally {
            this.stopTranscription = null;
            if (this.inFlight === promise) {
                this.inFlight = null;
            }
        }
    }
    async cancelTranscription() {
        await this.stopTranscription?.();
    }
    /** Stops an in-flight decode and waits for it before freeing the context. */
    async release() {
        this.generation++;
        this.loading = null;
        await this.stopTranscription?.().catch(() => { });
        await this.inFlight?.catch(() => { });
        await this.releaseContext();
    }
    async releaseContext() {
        const context = this.context;
        this.context = null;
        this.loadedTier = null;
        if (context) {
            try {
                await context.release();
            }
            catch (err) {
                console.warn('[WhisperAsrEngine] release failed:', err);
            }
        }
    }
}
export const whisperAsrEngine = new WhisperAsrEngine();
