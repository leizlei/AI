import { fetchJson, requireKey } from './http';
export class BraveProvider {
    constructor(getKey) {
        this.getKey = getKey;
        this.id = 'brave';
    }
    async search(query, opts, signal) {
        const key = requireKey(this.getKey(), 'Brave');
        const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${opts.maxResults}`;
        const data = await fetchJson(url, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'X-Subscription-Token': key,
            },
            signal,
        }, { retryOn429: true });
        if (data?.type !== 'search') {
            throw new Error('unexpected response');
        }
        return (data.web?.results ?? []).map(r => ({
            title: r.title ?? '',
            url: r.url ?? '',
            snippet: r.description ?? '',
            ...(r.page_age ? { publishedAt: r.page_age } : {}),
        }));
    }
}
