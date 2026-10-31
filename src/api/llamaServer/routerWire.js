/**
 * Pure reading of the llama-server router wire: list rows, `/models/sse`
 * payloads and error bodies. Nothing here decides an outcome; an event says a
 * model's situation may have changed, and only a later list read says what it
 * is.
 */
/** Overall fraction across the load's stages for one reading; undefined when unplaceable. */
export function loadFraction(progress) {
    const value = progress?.value;
    if (value === undefined || !(value >= 0 && value <= 1)) {
        return undefined;
    }
    const stages = progress?.stages;
    if (!stages) {
        return value;
    }
    const index = progress?.current ? stages.indexOf(progress.current) : -1;
    return index < 0 ? undefined : (index + value) / stages.length;
}
/** A router's answer to a completion for a model it does not have loaded. */
export const isModelNotLoaded = (error) => {
    const { status, serverMessage } = (error ?? {});
    return status === 400 && serverMessage === 'model is not loaded';
};
const ROUTER_STATUSES = [
    'unloaded',
    'loading',
    'loaded',
    'sleeping',
    'downloading',
];
function asStatus(value) {
    return typeof value === 'string' && ROUTER_STATUSES.includes(value)
        ? value
        : undefined;
}
function listState(state) {
    return state;
}
/** Total: every row, and the absence of one, maps to a member. */
export function mapRowStatus(row) {
    if (!row) {
        return listState('absent');
    }
    if (row.status?.failed === true) {
        return listState('failed');
    }
    return listState(asStatus(row.status?.value) ?? 'unknown');
}
/** Upstream matches a row to a model by either key; so does this. */
export function rowMatchesKey(row, id) {
    return row.id === id || row.model === id;
}
/**
 * The one reading of a server's list for one model. A stale list still holds
 * the row (so the model is not `absent`), but nothing has corroborated its
 * state since, so the state reads `unknown`.
 */
export function rowStateFromList(rows, remoteModelId, stale) {
    const row = rows.find(candidate => rowMatchesKey(candidate, remoteModelId));
    return mapRowStatus(row && stale ? { id: row.id } : row);
}
/** A row carries router evidence when its `status` is an object. */
export function hasRouterStatus(row) {
    const status = row?.status;
    return typeof status === 'object' && status !== null;
}
/** The exit code a failed row carries, presence-checked. */
export function rowExitCode(rows, remoteModelId) {
    const code = rows.find(row => rowMatchesKey(row, remoteModelId))?.status
        ?.exit_code;
    return typeof code === 'number' ? code : undefined;
}
function readLoadProgress(raw) {
    if (!raw || typeof raw !== 'object') {
        return undefined;
    }
    const source = raw;
    const progress = {};
    if (Array.isArray(source.stages)) {
        progress.stages = source.stages.filter((stage) => typeof stage === 'string');
    }
    if (typeof source.current === 'string') {
        progress.current = source.current;
    }
    // 0.0 is the first tick of a real load, so presence is what is tested.
    if (typeof source.value === 'number' && Number.isFinite(source.value)) {
        progress.value = source.value;
    }
    return Object.keys(progress).length > 0 ? progress : undefined;
}
/**
 * `model_status` fires once as an acknowledgement and every later transition
 * arrives as `status_change`; both take the same path. Download events are
 * ignored, and an unrecognised or malformed payload settles nothing.
 */
export function reduceRouterEvent(payload) {
    if (!payload || typeof payload !== 'object') {
        return { kind: 'ignore' };
    }
    const { event, model, data } = payload;
    if (event === 'models_reload' || event === 'model_remove') {
        return { kind: 'read' };
    }
    if (event !== 'status_change' && event !== 'model_status') {
        return { kind: 'ignore' };
    }
    if (typeof model !== 'string' ||
        !model ||
        !data ||
        typeof data !== 'object') {
        return { kind: 'ignore' };
    }
    const status = asStatus(data.status) ??
        (typeof data.status === 'string' ? 'unknown' : undefined);
    const progress = readLoadProgress(data.progress);
    const exitCode = typeof data.exit_code === 'number' ? data.exit_code : undefined;
    if (status === undefined && !progress) {
        return { kind: 'ignore' };
    }
    return {
        kind: 'update',
        model,
        ...(status !== undefined && { status }),
        ...(progress && { progress }),
        ...(exitCode !== undefined && { exitCode }),
    };
}
const SERVER_TEXT_MAX = 200;
/**
 * The words a server gave for a refusal, bounded where they enter so that what
 * is held is bounded too. Counted in code points, so a cut never splits a
 * surrogate pair. Only four times the cap in UTF-16 units is walked: a code
 * point is at most two units, and the rest leaves room for whitespace runs
 * that collapse to one space.
 */
export function serverReason(body) {
    const source = body;
    const candidates = [source?.error?.message, source?.error, source?.message];
    for (const candidate of candidates) {
        if (typeof candidate !== 'string') {
            continue;
        }
        const text = candidate
            .slice(0, SERVER_TEXT_MAX * 4)
            .replace(/\s+/g, ' ')
            .trim();
        if (text) {
            return Array.from(text).slice(0, SERVER_TEXT_MAX).join('');
        }
    }
    return undefined;
}
