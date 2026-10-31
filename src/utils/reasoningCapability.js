import { ModelOrigin } from './types';
/**
 * Canonical axis-2 effort levels, in pill-cycle order from lowest to highest
 * intensity. The universal set across reasoning families that grade effort; a
 * model may support a subset. `effortValues` is always stored in this order so
 * the pill cycles consistently.
 */
export const EFFORT_LEVELS = [
    'minimal',
    'low',
    'medium',
    'high',
    'xhigh',
    'max',
];
/**
 * Standard subset pre-selected the first time a user enables graded effort on
 * a model — gives the chips an immediate selected/unselected contrast (instead
 * of an all-blank row that doesn't read as togglable) and a sensible default.
 */
export const DEFAULT_EFFORT_VALUES = ['low', 'medium', 'high'];
/** Order an effort-level selection canonically (lowest→highest intensity). */
export function orderEffortValues(values) {
    return EFFORT_LEVELS.filter(level => values.includes(level));
}
export function clampEffort(effort, effortValues) {
    if (!effort || effortValues.length === 0) {
        return undefined;
    }
    if (effortValues.includes(effort)) {
        return effort;
    }
    const rank = (level) => EFFORT_LEVELS.indexOf(level);
    const lower = effortValues.filter(value => rank(value) < rank(effort));
    return lower[lower.length - 1] ?? effortValues[0];
}
const UNKNOWN = {
    isReasoning: 'unknown',
    source: 'unknown',
    supportsEffort: false,
    effortValues: [],
    effortSource: 'none',
};
/**
 * Resolve the effective reasoning capability for a model. Single source of
 * truth — no component reads `supportsThinking` directly post-migration.
 *
 * Local models read `model.reasoning`; remote models (not persisted) read
 * `remoteReasoning[model.id]`. When neither is present the legacy
 * `supportsThinking` boolean is the fail-open fallback: `true` → 'yes',
 * `false` → 'no', absent → 'unknown'. Axis-2 (effort) is reported only when
 * axis-1 is not 'no'.
 */
export function resolveReasoningCapability(model, remoteReasoning) {
    if (!model) {
        return UNKNOWN;
    }
    const stored = model.origin === ModelOrigin.REMOTE
        ? remoteReasoning[model.id]
        : model.reasoning;
    let resolved;
    if (stored) {
        resolved = stored;
    }
    else if (model.supportsThinking === true) {
        resolved = { ...UNKNOWN, isReasoning: 'yes', source: 'detected' };
    }
    else if (model.supportsThinking === false) {
        resolved = { ...UNKNOWN, isReasoning: 'no', source: 'detected' };
    }
    else {
        resolved = UNKNOWN;
    }
    // Axis-2 is inert when axis-1 is 'no'.
    if (resolved.isReasoning === 'no') {
        return {
            ...resolved,
            supportsEffort: false,
            effortValues: [],
            effortSource: 'none',
        };
    }
    return resolved;
}
