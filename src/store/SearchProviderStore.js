import { makeAutoObservable, runInAction } from 'mobx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { makePersistable } from 'mobx-persist-store';
import * as Keychain from 'react-native-keychain';
import { resetSearchCache } from '../services/search/searchBudget';
/** Distinct Keychain service per provider so iOS entries co-exist. */
const keychainService = (id) => `search_provider_service_${id}`;
/** Parallel ships gated (not selectable) until its free-tier/PAYG terms are confirmed. */
export const SEARCH_PROVIDERS = [
    { id: 'tavily', label: 'Tavily', selectable: true },
    { id: 'brave', label: 'Brave', selectable: true },
    { id: 'exa', label: 'Exa', selectable: true },
    { id: 'firecrawl', label: 'Firecrawl', selectable: true },
    { id: 'you', label: 'You.com', selectable: true, requiresKey: false },
    {
        id: 'searxng-local',
        label: 'SearXNG (本地/内网)',
        selectable: true,
        requiresKey: false,
        needsBaseUrl: true,
    },
    { id: 'parallel', label: 'Parallel', selectable: false },
];
const DEFAULT_PROVIDER = 'brave';
const DEFAULT_RESULT_COUNT = 5;
const MIN_RESULT_COUNT = 1;
const MAX_RESULT_COUNT = 8;
class SearchProviderStore {
    constructor() {
        this.activeProviderId = DEFAULT_PROVIDER;
        this.resultCount = DEFAULT_RESULT_COUNT;
        this.hasConsentedToSearch = false;
        /** Self-hosted SearXNG base URL for the `searxng-local` provider (plain text, not a secret). */
        this.searxngBaseUrl = '';
        /** In-memory mirror of each provider's BYOK key (source of truth: Keychain). */
        this.keys = {};
        makeAutoObservable(this);
        makePersistable(this, {
            name: 'SearchProviderStore',
            properties: [
                'activeProviderId',
                'resultCount',
                'hasConsentedToSearch',
                'searxngBaseUrl',
            ],
            storage: AsyncStorage,
        }).then(() => this.normalizeHydratedPrefs());
        this.loadKeysFromSecureStorage();
    }
    // Persisted prefs skip the setters — re-validate after hydration so a stale
    // gated/unknown provider, malformed type, or out-of-range count can't
    // survive a reload. Consent is a privacy gate: only a literal true counts.
    normalizeHydratedPrefs() {
        const meta = SEARCH_PROVIDERS.find(p => p.id === this.activeProviderId);
        const provider = meta && meta.selectable ? this.activeProviderId : DEFAULT_PROVIDER;
        const rawCount = this.resultCount;
        const count = typeof rawCount === 'number' && Number.isFinite(rawCount)
            ? Math.min(MAX_RESULT_COUNT, Math.max(MIN_RESULT_COUNT, Math.round(rawCount)))
            : DEFAULT_RESULT_COUNT;
        const consent = this.hasConsentedToSearch === true;
        const baseUrl = typeof this.searxngBaseUrl === 'string'
            ? this.searxngBaseUrl.trim()
            : '';
        runInAction(() => {
            this.activeProviderId = provider;
            this.resultCount = count;
            this.hasConsentedToSearch = consent;
            this.searxngBaseUrl = baseUrl;
        });
    }
    async loadKeysFromSecureStorage() {
        for (const { id } of SEARCH_PROVIDERS) {
            try {
                const credentials = await Keychain.getGenericPassword({
                    service: keychainService(id),
                });
                if (credentials) {
                    runInAction(() => {
                        this.keys[id] = credentials.password;
                    });
                }
            }
            catch (error) {
                console.error(`Failed to load ${id} search key:`, error);
            }
        }
    }
    get providers() {
        return SEARCH_PROVIDERS;
    }
    getKey(id) {
        return this.keys[id] ?? '';
    }
    hasKey(id) {
        return (this.keys[id] ?? '').trim().length > 0;
    }
    /** True when the provider works without a key (a key is optional). */
    isKeyOptional(id) {
        return SEARCH_PROVIDERS.find(p => p.id === id)?.requiresKey === false;
    }
    /** True when the provider is configured through a base URL rather than a key. */
    isNeedsBaseUrl(id) {
        return SEARCH_PROVIDERS.find(p => p.id === id)?.needsBaseUrl === true;
    }
    getSearxngBaseUrl() {
        return this.searxngBaseUrl ?? '';
    }
    get isProviderConfigured() {
        if (this.isNeedsBaseUrl(this.activeProviderId)) {
            return this.searxngBaseUrl.trim().length > 0;
        }
        return (this.isKeyOptional(this.activeProviderId) ||
            this.hasKey(this.activeProviderId));
    }
    get canSearch() {
        return this.hasConsentedToSearch && this.isProviderConfigured;
    }
    setActiveProvider(id) {
        const meta = SEARCH_PROVIDERS.find(p => p.id === id);
        if (!meta || !meta.selectable) {
            return;
        }
        runInAction(() => {
            this.activeProviderId = id;
        });
        resetSearchCache();
    }
    setResultCount(count) {
        const clamped = Math.min(MAX_RESULT_COUNT, Math.max(MIN_RESULT_COUNT, Math.round(count)));
        runInAction(() => {
            this.resultCount = clamped;
        });
    }
    setConsent(consented) {
        runInAction(() => {
            this.hasConsentedToSearch = consented;
        });
        resetSearchCache();
    }
    setSearxngBaseUrl(url) {
        runInAction(() => {
            this.searxngBaseUrl = (url ?? '').trim();
        });
        resetSearchCache();
    }
    async setKey(id, key) {
        try {
            await Keychain.setGenericPassword(id, key, {
                service: keychainService(id),
            });
            runInAction(() => {
                this.keys[id] = key;
            });
            resetSearchCache();
            return true;
        }
        catch (error) {
            console.error(`Failed to save ${id} search key:`, error);
            return false;
        }
    }
    async clearKey(id) {
        try {
            await Keychain.resetGenericPassword({ service: keychainService(id) });
            runInAction(() => {
                delete this.keys[id];
            });
            resetSearchCache();
            return true;
        }
        catch (error) {
            console.error(`Failed to clear ${id} search key:`, error);
            return false;
        }
    }
}
export const searchProviderStore = new SearchProviderStore();
export { SearchProviderStore };
