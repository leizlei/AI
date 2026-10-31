import { openEventStream } from '../eventStream';
import { CONNECTION_TIMEOUT_MS, buildHeaders, fetchWithTimeout, normalizeUrl, resolveTimeout, } from '../http';
async function postModelOp(target, path, model, signal) {
    const response = await fetchWithTimeout(`${normalizeUrl(target.url)}${path}`, {
        method: 'POST',
        headers: buildHeaders(target.apiKey),
        body: JSON.stringify({ model }),
    }, {
        timeoutMs: resolveTimeout(target.timeoutMs, CONNECTION_TIMEOUT_MS),
        signal,
    });
    let body = null;
    try {
        body = await response.json();
    }
    catch {
        body = null;
    }
    return { status: response.status, body };
}
export function postLoad(target, model, signal) {
    return postModelOp(target, '/models/load', model, signal);
}
export function postUnload(target, model, signal) {
    return postModelOp(target, '/models/unload', model, signal);
}
/**
 * `GET /models/sse`. No idle timeout: a quiet router is a healthy one, and
 * liveness is judged elsewhere from list reads.
 */
export function openRouterEvents(target, handlers) {
    const deliver = (events) => {
        for (const event of events) {
            if (event !== 'done') {
                handlers.onEvent(event);
            }
        }
    };
    return openEventStream(`${normalizeUrl(target.url)}/models/sse`, {
        headers: {
            ...buildHeaders(target.apiKey),
            Accept: 'text/event-stream',
        },
        connectTimeoutMs: resolveTimeout(target.timeoutMs, CONNECTION_TIMEOUT_MS),
    }, {
        onOpen: handlers.onOpen,
        onEvents: deliver,
        onLoad: flushed => {
            deliver(flushed);
            handlers.onEnd();
        },
        onHttpError: status => handlers.onEnd(status),
        onNetworkError: () => handlers.onEnd(),
        onConnectTimeout: () => handlers.onEnd(),
        onAbort: () => handlers.onEnd(),
    });
}
