import { finiteNumber } from './finite';
const APP_ONLY_KEYS = [
    'version',
    'include_thinking_in_context',
];
export function toApiCompletionParams(params) {
    const apiParams = { ...params };
    for (const key of APP_ONLY_KEYS) {
        delete apiParams[key];
    }
    return apiParams;
}
const TIMING_FIELDS = [
    'prompt_n',
    'prompt_ms',
    'prompt_per_token_ms',
    'prompt_per_second',
    'predicted_n',
    'predicted_ms',
    'predicted_per_token_ms',
    'predicted_per_second',
    'cache_n',
];
/** Nothing but finite numbers is written; a value nobody can use is dropped. */
export function normaliseTimings(raw) {
    if (typeof raw !== 'object' || raw === null) {
        return undefined;
    }
    const source = raw;
    const timings = {};
    for (const field of TIMING_FIELDS) {
        const value = finiteNumber(source[field]);
        if (value !== undefined) {
            timings[field] = value;
        }
    }
    return Object.keys(timings).length > 0 ? timings : undefined;
}
