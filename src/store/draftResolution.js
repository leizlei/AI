import { isMTPCapable, nEmbdOut } from '../utils/mtp';
import { CacheType, ModelOrigin } from '../utils/types';
// A model paired with itself is loaded twice, so it never counts as its own draft.
export const resolveDraftModelId = (target, selectedDraftModelId) => {
    const draftId = target.defaultDraftModel ?? selectedDraftModelId;
    return draftId === target.id ? undefined : draftId;
};
export const unpairedDraftCandidate = (target) => isMTPCapable(target) ? { mode: 'embedded' } : { mode: 'off' };
const isUsableDraft = (draft) => !!draft?.isDownloaded && isMTPCapable(draft);
// A width mismatch on a paired draft is an uncatchable native abort
// (GGML_ASSERT → SIGABRT in init_mtp), so an unknown width is not paired.
export const resolveDraftCandidate = (target, models, params) => {
    if (!params.speculativeEnabled) {
        return { mode: 'off' };
    }
    const draftId = resolveDraftModelId(target, params.selectedDraftModelId);
    const draftModel = draftId ? models.find(m => m.id === draftId) : undefined;
    if (isUsableDraft(draftModel)) {
        const draftWidth = nEmbdOut(draftModel.ggufMetadata);
        const targetWidth = target.ggufMetadata?.n_embd;
        if (draftWidth !== undefined &&
            targetWidth !== undefined &&
            draftWidth === targetWidth) {
            return { mode: 'paired', draftModel };
        }
    }
    return unpairedDraftCandidate(target);
};
// The draft settings are global next-load knobs, so without a local target
// there is no width to check against and nothing loading to protect: the mode
// is whatever the global pick alone implies.
export const effectiveDraftModeOf = (source) => {
    const target = source.activeModel?.origin === ModelOrigin.REMOTE
        ? undefined
        : source.activeModel;
    if (target) {
        return resolveDraftCandidate(target, source.models, source.contextInitParams).mode;
    }
    const { speculativeEnabled, selectedDraftModelId } = source.contextInitParams;
    if (!speculativeEnabled || !selectedDraftModelId) {
        return 'off';
    }
    return isUsableDraft(source.models.find(m => m.id === selectedDraftModelId))
        ? 'paired'
        : 'off';
};
/**
 * A quantized draft V cache is fatal without flash attention: llama.cpp
 * refuses the MTP context ("quantized V cache ... requires Flash Attention"),
 * and `auto` resolves per backend AFTER init params are committed — on
 * Android CPU it resolves off. Q8_0 is therefore only defaulted when the
 * user explicitly forced flash attention on; anything else gets F16.
 */
export const draftCacheDefaults = (mode, flashAttnForcedOn) => mode === 'embedded' && flashAttnForcedOn
    ? { k: CacheType.Q8_0, v: CacheType.Q8_0 }
    : { k: CacheType.F16, v: CacheType.F16 };
