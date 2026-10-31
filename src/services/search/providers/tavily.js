import { fetchJson, requireKey } from './http';
export class TavilyProvider {
    constructor(getKey) {
        this.getKey = getKey;
        this.id = 'tavily';
    }
    async search(query, opts, signal) {
        const key = requireKey(this.getKey(), 'Tavily');
        const data = await fetchJson('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                api_key: key,
                query,
                max_results: opts.maxResults,
                search_depth: 'basic',
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
            snippet: r.content ?? '',
            ...(r.published_date ? { publishedAt: r.published_date } : {}),
        }));
    }
}
