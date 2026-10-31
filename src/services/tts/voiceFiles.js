import * as RNFS from '@dr.pogodin/react-native-fs';
import { getNeuralEngine } from './engineRegistry';
import { ensureVoiceFileAt } from './voiceFileDownload';
const voiceFileOf = (voice) => voice.engine === 'system'
    ? undefined
    : getNeuralEngine(voice.engine).voiceFile?.(voice.id);
/** True when the voice's own file is on disk, or the voice has none. */
export const hasVoiceFile = async (voice) => {
    const file = voiceFileOf(voice);
    return file ? RNFS.exists(file.path) : true;
};
/** Present, or downloaded now. Resolves `false` on failure; never rejects. */
export const ensureVoiceFile = async (voice) => {
    const file = voiceFileOf(voice);
    return file ? ensureVoiceFileAt(voice, file) : true;
};
