import { fetchJson, requireKey } from './http';
const SCRAPE_SERVER_TIMEOUT_MS = 10000;
export class FirecrawlProvider {
    constructor(getKey) {
        this.getKey = getKey;
        this.id = 'firecrawl';
    }
    async search(query, opts, signal) {
        const res = await this.post('/search', { query, limit: opts.maxResults }, { retryOn429: true, signal });
        if (res?.success !== true || !res.data) {
            throw new Error('unexpected response');
        }
        return (res.data.web ?? []).map(r => ({
            title: r.title ?? '',
            url: r.url ?? '',
            snippet: r.description ?? '',
        }));
    }
    async read(url, signal) {
        const res = await this.post('/scrape', {
            url,
            formats: ['markdown'],
            onlyMainContent: true,
            timeout: SCRAPE_SERVER_TIMEOUT_MS,
        }, { signal });
        if (res.success !== true || !res.data) {
            throw new Error('scrape failed');
        }
        const code = res.data.metadata?.statusCode;
        if (code !== undefined && code >= 400) {
            throw new Error(`page returned ${code}`);
        }
        return {
            url,
            ...(res.data.metadata?.title ? { title: res.data.metadata.title } : {}),
            text: res.data.markdown ?? '',
        };
    }
    post(path, body, { retryOn429, signal } = {}) {
        const key = requireKey(this.getKey(), 'Firecrawl');
        return fetchJson(`https://api.firecrawl.dev/v2${path}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${key}`,
            },
            body: JSON.stringify({ ...body, origin: 'pocketpal' }),
            signal,
        }, { retryOn429 });
    }
}
