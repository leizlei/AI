import { fetchJson, requireKey } from './http';
/**
 * Ships gated (SearchProviderStore `selectable: false`) — listed but not
 * selectable until free-tier/PAYG terms are confirmed.
 */
export class ParallelProvider {
    constructor(getKey) {
        this.getKey = getKey;
        this.id = 'parallel';
    }
    async search(query, opts, signal) {
        const key = requireKey(this.getKey(), 'Parallel');
        const data = await fetchJson('https://api.parallel.ai/v1/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': key },
            body: JSON.stringify({
                objective: query,
                max_results: opts.maxResults,
            }),
            signal,
        }, { retryOn429: true });
        const results = data?.results;
        if (!Array.isArray(results)) {
            throw new Error('unexpected response');
        }
        return results.map(r => ({
            title: r.title ?? '',
            url: r.url ?? '',
            snippet: (r.excerpts ?? []).join(' '),
            ...(r.published_date ? { publishedAt: r.published_date } : {}),
        }));
    }
}
