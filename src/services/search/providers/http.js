/**
 * Body-size cap stops a hostile/oversized response from buffering into JS memory
 * and OOMing a device holding a multi-GB model. Calls throw — never silent-empty.
 */
const DEFAULT_TIMEOUT_MS = 12000;
const MAX_BODY_BYTES = 2 * 1024 * 1024;
export const requireKey = (key, providerLabel) => {
    if (!key || key.trim().length === 0) {
        throw new Error(`${providerLabel} key not set`);
    }
    return key.trim();
};
const withTimeout = async (input, init, timeoutMs) => {
    const callerSignal = init.signal;
    if (callerSignal?.aborted) {
        throw new Error('cancelled');
    }
    const controller = new AbortController();
    let firedBy;
    const fire = (source) => {
        firedBy ?? (firedBy = source);
        controller.abort();
    };
    const onCallerAbort = () => fire('caller');
    const timer = setTimeout(() => fire('timer'), timeoutMs);
    callerSignal?.addEventListener('abort', onCallerAbort);
    try {
        return await fetch(input, {
            ...init,
            credentials: 'omit',
            signal: controller.signal,
        });
    }
    catch (e) {
        if (firedBy === 'caller') {
            throw new Error('cancelled');
        }
        if (firedBy === 'timer') {
            throw new Error('timed out');
        }
        throw e;
    }
    finally {
        clearTimeout(timer);
        callerSignal?.removeEventListener('abort', onCallerAbort);
    }
};
const assertWithinDeclaredSize = (res) => {
    const declared = res.headers?.get?.('content-length');
    if (declared) {
        const bytes = Number(declared);
        if (Number.isFinite(bytes) && bytes > MAX_BODY_BYTES) {
            throw new Error('response too large');
        }
    }
};
const DEFAULT_RETRY_WAIT_MS = 1000;
const MAX_RETRY_WAIT_MS = 2000;
const parseSecondsMs = (value) => /^\d+(\.\d+)?$/.test(value.trim()) ? Number(value) * 1000 : null;
const retryAfterMs = (value) => {
    const seconds = parseSecondsMs(value);
    if (seconds !== null) {
        return seconds;
    }
    const date = Date.parse(value);
    return Number.isNaN(date) ? null : date - Date.now();
};
const rateLimitResetMs = (value) => {
    const waits = value
        .split(',')
        .map(parseSecondsMs)
        .filter((ms) => ms !== null);
    return waits.length > 0 ? Math.min(...waits) : null;
};
/** The wait before retrying a 429, or null when the server asks for longer. */
const rateLimitRetryWaitMs = (res) => {
    const retryAfter = res.headers?.get?.('retry-after');
    const reset = res.headers?.get?.('x-ratelimit-reset') ??
        res.headers?.get?.('ratelimit-reset');
    const hint = retryAfter != null
        ? retryAfterMs(retryAfter)
        : reset != null
            ? rateLimitResetMs(reset)
            : null;
    if (hint === null || hint < 0) {
        return DEFAULT_RETRY_WAIT_MS;
    }
    return hint <= MAX_RETRY_WAIT_MS ? hint : null;
};
const waitOrCancel = (ms, signal) => new Promise((resolve, reject) => {
    if (signal?.aborted) {
        reject(new Error('cancelled'));
        return;
    }
    const onAbort = () => {
        clearTimeout(timer);
        signal?.removeEventListener('abort', onAbort);
        reject(new Error('cancelled'));
    };
    const timer = setTimeout(() => {
        signal?.removeEventListener('abort', onAbort);
        resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort);
});
export const fetchJson = async (input, init, { timeoutMs = DEFAULT_TIMEOUT_MS, retryOn429 = false, } = {}) => {
    let res = await withTimeout(input, init, timeoutMs);
    const retryWaitMs = retryOn429 && res.status === 429 ? rateLimitRetryWaitMs(res) : null;
    if (retryWaitMs !== null) {
        await waitOrCancel(retryWaitMs, init.signal);
        res = await withTimeout(input, init, timeoutMs);
    }
    if (!res.ok) {
        throw new Error(`request failed (${res.status})`);
    }
    assertWithinDeclaredSize(res);
    // RN fetch can't stream-cap; bound the text before JSON.parse so an unsized
    // over-cap body isn't parsed into an even larger object.
    const text = await res.text();
    if (text.length > MAX_BODY_BYTES) {
        throw new Error('response too large');
    }
    return JSON.parse(text);
};
export const fetchText = async (input, init, timeoutMs = DEFAULT_TIMEOUT_MS) => {
    const res = await withTimeout(input, init, timeoutMs);
    if (!res.ok) {
        throw new Error(`request failed (${res.status})`);
    }
    assertWithinDeclaredSize(res);
    // RN fetch is XHR-backed (no streaming reader), so the full body is
    // materialized here before this slice — the clamp caps output, not peak memory.
    const text = await res.text();
    return text.length > MAX_BODY_BYTES ? text.slice(0, MAX_BODY_BYTES) : text;
};
