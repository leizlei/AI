import { resolveRemoteCaps } from './remoteCaps';
import { ModelOrigin } from './types';
const UNKNOWN = {
    vision: 'unknown',
    visionActive: false,
};
const positive = (value) => value !== undefined && value > 0 ? value : undefined;
const triState = (value) => {
    if (value === undefined) {
        return 'unknown';
    }
    return value ? 'yes' : 'no';
};
/**
 * Resolve the effective capabilities of a model. Single source of truth — the
 * only place `model.origin` is branched on to answer a capability question, so
 * its consumers cannot structurally disagree.
 *
 * Pure and synchronous by design: callers resolve inside an `observer` render
 * body, so a capability landing from a detached probe re-renders on its own.
 */
export function resolveModelCaps(model, env) {
    if (!model) {
        return UNKNOWN;
    }
    // Context facts describe the live session, so they apply to the active model
    // alone — a card must never borrow another model's load state.
    const isActiveModel = model.id === env.activeModelId;
    if (model.origin === ModelOrigin.REMOTE) {
        // Two tiers, merged field by field rather than entry by entry: a probe
        // answers about a loaded model, the models list about a configured one, so
        // one can answer where the other is silent. `positive` runs per tier — a
        // legacy zero in a probe entry must not discard a usable listed window.
        const confirmed = resolveRemoteCaps(model, env.remoteCaps, env.binding);
        const listed = env.listCaps[model.id];
        return {
            vision: triState(confirmed.supportsVision ?? listed?.supportsVision),
            contextLength: positive(confirmed.contextLength) ?? positive(listed?.contextLength),
            // The session axis reads the probe alone: a listed value describes how
            // the server is configured, never what the live session can do.
            visionActive: isActiveModel && confirmed.supportsVision === true,
            effectiveContextLength: isActiveModel
                ? positive(confirmed.contextLength)
                : undefined,
        };
    }
    return {
        vision: triState(model.supportsMultimodal),
        visionActive: isActiveModel && env.isMultimodalActive,
        contextLength: positive(model.hfModel?.specs?.gguf?.context_length) ??
            positive(model.ggufMetadata?.context_length),
        effectiveContextLength: isActiveModel
            ? positive(env.activeContextSettings?.n_ctx)
            : undefined,
    };
}
