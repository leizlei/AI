import { fetchJson } from './http';
/** Trim a trailing slash and normalize the user-entered base URL. */
const normalizeBaseUrl = (raw) => {
    let base = (raw ?? '').trim();
    if (!base) {
        return '';
    }
    // Add a scheme when the user typed a bare host:port (e.g. `192.168.1.100:8080`).
    if (!/^https?:\/\//i.test(base)) {
        base = `http://${base}`;
    }
    return base.replace(/\/+$/, '');
};
export class SearXNGLocalProvider {
    constructor(getBaseUrl) {
        this.getBaseUrl = getBaseUrl;
        this.id = 'searxng-local';
    }
    async search(query, opts, signal) {
        const base = normalizeBaseUrl(this.getBaseUrl());
        if (!base) {
            throw new Error('SearXNG local base URL not set. Enter your self-hosted SearXNG address in Settings → Internet Search.');
        }
        const url = new URL(`${base}/search`);
        url.searchParams.set('q', query);
        url.searchParams.set('format', 'json');
        url.searchParams.set('language', 'auto');
        const data = await fetchJson(url.toString(), {
            method: 'GET',
            headers: { Accept: 'application/json' },
            signal,
        }, { retryOn429: true });
        const results = data?.results;
        if (!Array.isArray(results)) {
            throw new Error('unexpected response from SearXNG');
        }
        return results.slice(0, opts.maxResults).map(r => {
            const publishedAt = r.publishedDate || r.published_date || undefined;
            return {
                title: r.title ?? '',
                url: r.url ?? '',
                snippet: r.content ?? '',
                ...(publishedAt ? { publishedAt } : {}),
            };
        });
    }
}
