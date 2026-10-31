/**
 * Convert a raw grammar_triggers entry (the `value` may be a partial
 * regex/sentinel) to a plain text marker the streaming code can scan
 * for in `accumulated_text`. Filters out empty / token-only entries.
 */
function extractTextMarkers(triggers) {
    if (!triggers || triggers.length === 0) {
        return [];
    }
    const out = [];
    for (const t of triggers) {
        const value = t?.value;
        if (typeof value === 'string' && value.length > 0) {
            out.push(value);
        }
    }
    return out;
}
export function createTriggerMarkerCache() {
    // Map key: `${contextId}::${sortedToolNames.join(',')}`. Tools list is
    // part of the key because different Pals advertise different schemas
    // and the resulting grammar may differ across them.
    const cache = new Map();
    return {
        async getMarkers(contextId, tools, getFormattedChat) {
            const toolNames = tools
                .map(t => t.function?.name)
                .filter((n) => !!n)
                .sort();
            const key = `${contextId}::${toolNames.join(',')}`;
            const cached = cache.get(key);
            if (cached) {
                return cached;
            }
            try {
                const result = await getFormattedChat();
                const markers = extractTextMarkers(result.grammar_triggers);
                cache.set(key, markers);
                return markers;
            }
            catch {
                // Fail open: a cache miss returns no markers and the runner
                // simply skips the marker_seen event for this turn.
                cache.set(key, []);
                return [];
            }
        },
    };
}
