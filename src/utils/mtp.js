import { readGGUFHeaderForMTP } from './ggufHeader';
export const isMTPCapable = (model) => (model.ggufMetadata?.nextn_predict_layers ?? 0) > 0;
/**
 * A draft-only artifact speculates for a target but cannot be a chat model:
 * loading one fails in llama.rn with "Failed to load model". Embedded-MTP
 * models also carry `nextn_predict_layers`, so the arch suffix — not the layer
 * count — is what separates the two.
 */
// Converters disagree on the separator (`gemma4-assistant`, `gemma4_assistant`)
// and some older ones tag the draft `*_mtp`, so match on the suffix word.
export const isDraftOnlyArch = (architecture) => /[-_](assistant|mtp)$/.test((architecture ?? '').toLowerCase());
// Naming-convention signal for when no GGUF header is available yet:
// ggml-org publishes drafts as `mtp-<target>`; converters use an `assistant`
// token. Token match only — "openassistant-…" is a chat model, not a draft.
export const isDraftOnlyFilename = (filename) => {
    const name = (filename ?? '').toLowerCase().split('/').pop() ?? '';
    return name.startsWith('mtp-') || /(^|[-_.])assistant([-_.]|$)/.test(name);
};
// The header is authoritative: a filename convention must never override a
// valid chat architecture. The filename decides only pre-download, where the
// HF search has no header to consult.
export const isDraftOnlyModel = (model) => model.ggufMetadata?.architecture
    ? isDraftOnlyArch(model.ggufMetadata.architecture)
    : isDraftOnlyFilename(model.filename);
// Width the native paired assert compares: n_embd_out(draft) == n_embd(target).
export const nEmbdOut = (meta) => meta?.embedding_length_out ?? meta?.n_embd;
// A probe still costs a few range requests and a header walk, so a reopened
// details sheet must not pay it twice. `unknown` is not cached: it marks a
// probe that could not run, and a retry may succeed.
const probeCache = new Map();
const PROBE_CACHE_MAX = 64;
// Range-fetches the GGUF header. Some converters omit the KV but still write
// `nextn.*` tensors, hence the tensor-name fallback inside the reader.
export const probeRemoteMTPCapability = async (ggufUrl) => {
    const cached = probeCache.get(ggufUrl);
    if (cached) {
        return cached;
    }
    try {
        const { nextnPredictLayers, hasNextnTensor } = await readGGUFHeaderForMTP(ggufUrl);
        const result = nextnPredictLayers > 0 || hasNextnTensor ? 'capable' : 'not-capable';
        if (probeCache.size >= PROBE_CACHE_MAX) {
            probeCache.delete(probeCache.keys().next().value);
        }
        probeCache.set(ggufUrl, result);
        return result;
    }
    catch (error) {
        console.warn('[mtp] remote capability probe could not run:', error);
        return 'unknown';
    }
};
