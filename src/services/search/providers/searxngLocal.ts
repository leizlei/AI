import type {SearchProvider, SearchHit, SearchOptions} from '../types';
import {fetchJson} from './http';

/**
 * Self-hosted SearXNG reached over the local (or private) network.
 *
 * Unlike the BYOK providers, this one needs no API key — it needs a base URL
 * (e.g. `http://192.168.1.100:8080`) the user enters in Settings. The app
 * simply calls `${baseUrl}/search?q=<query>&format=json`; the SearXNG instance
 * does the real aggregation against upstream engines.
 */
interface SearXNGResult {
  title?: string;
  url?: string;
  content?: string;
  publishedDate?: string;
  published_date?: string;
}

interface SearXNGResponse {
  results?: SearXNGResult[];
}

/** Trim a trailing slash and normalize the user-entered base URL. */
const normalizeBaseUrl = (raw: string): string => {
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

export class SearXNGLocalProvider implements SearchProvider {
  readonly id = 'searxng-local' as const;

  constructor(private getBaseUrl: () => string) {}

  async search(
    query: string,
    opts: SearchOptions,
    signal?: AbortSignal,
  ): Promise<SearchHit[]> {
    const base = normalizeBaseUrl(this.getBaseUrl());
    if (!base) {
      throw new Error(
        'SearXNG local base URL not set. Enter your self-hosted SearXNG address in Settings → Internet Search.',
      );
    }

    const url = new URL(`${base}/search`);
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('language', 'auto');

    const data = await fetchJson<SearXNGResponse | null>(
      url.toString(),
      {
        method: 'GET',
        headers: {Accept: 'application/json'},
        signal,
      },
      {retryOn429: true},
    );

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
        ...(publishedAt ? {publishedAt} : {}),
      };
    });
  }
}
