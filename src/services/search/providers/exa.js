import { fetchJson, requireKey } from './http';
/** Pick Exa's smallest faithful body field: highlights → summary → text. */
const exaSnippet = (r) => {
    if (r.highlights && r.highlights.length > 0) {
        return r.highlights.join(' ');
    }
    return r.summary ?? r.text ?? '';
};
export class ExaProvider {
    constructor(getKey) {
        this.getKey = getKey;
        this.id = 'exa';
    }
    async search(query, opts, signal) {
        const key = requireKey(this.getKey(), 'Exa');
        const data = await fetchJson('https://api.exa.ai/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': key },
            body: JSON.stringify({
                query,
                numResults: opts.maxResults,
                contents: { highlights: true, summary: true },
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
            snippet: exaSnippet(r),
            ...(r.publishedDate ? { publishedAt: r.publishedDate } : {}),
        }));
    }
    async read(url, signal) {
        const key = requireKey(this.getKey(), 'Exa');
        const data = await fetchJson('https://api.exa.ai/contents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': key },
            body: JSON.stringify({ urls: [url], text: true }),
            signal,
        });
        const results = data?.results;
        if (!Array.isArray(results)) {
            throw new Error('unexpected response');
        }
        const first = results[0];
        return {
            url,
            ...(first?.title ? { title: first.title } : {}),
            text: first?.text ?? '',
        };
    }
}
