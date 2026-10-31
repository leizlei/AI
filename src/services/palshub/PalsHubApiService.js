import { authService } from './AuthService';
import { getAuthHeaders } from './supabase';
import { clientHeaders, getApiBase } from './apiBase';
export class PalsHubError extends Error {
    constructor(message, details) {
        super(message);
        this.details = details;
        this.name = 'PalsHubError';
    }
}
const parseSampleExchange = (value) => {
    if (!Array.isArray(value)) {
        return undefined;
    }
    const turns = value.filter((turn) => turn != null &&
        (turn.role === 'user' || turn.role === 'pal') &&
        typeof turn.text === 'string' &&
        turn.text.length > 0);
    return turns.length > 0 ? turns : undefined;
};
class PalsHubApiService {
    get apiBase() {
        return getApiBase();
    }
    constructor() { }
    isConfigured() {
        return !!(this.apiBase && this.apiBase !== 'undefined');
    }
    // Get authentication headers using fresh session from Supabase
    async getAuthHeaders() {
        const authHeaders = await getAuthHeaders();
        const headers = {
            'Content-Type': 'application/json',
        };
        // Only add Authorization header if it exists
        if (authHeaders.Authorization) {
            headers.Authorization = authHeaders.Authorization;
        }
        return headers;
    }
    // Generic API request handler
    async apiRequest(endpoint, options = {}) {
        if (!this.isConfigured()) {
            throw new PalsHubError('PalsHub API not configured - missing PALSHUB_API_BASE_URL');
        }
        try {
            const headers = await this.getAuthHeaders();
            const url = `${this.apiBase}${endpoint}`;
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...headers,
                    ...clientHeaders(),
                    ...options.headers,
                },
            });
            if (!response.ok) {
                let errorData = {};
                try {
                    errorData = await response.json();
                }
                catch (parseError) {
                    console.error('Failed to parse error response:', parseError);
                }
                const errorMessage = errorData.error ||
                    errorData.message ||
                    `HTTP ${response.status}: ${response.statusText}`;
                console.error(`API Error [${response.status}]:`, errorMessage, errorData);
                throw new PalsHubError(errorMessage, {
                    status: response.status,
                    statusText: response.statusText,
                    ...errorData,
                });
            }
            return response.json();
        }
        catch (error) {
            if (error instanceof PalsHubError) {
                throw error;
            }
            const errorMessage = error instanceof Error ? error.message : 'Unknown network error';
            console.error('Network error:', errorMessage, error);
            throw new PalsHubError(`Network error: ${errorMessage}`, error);
        }
    }
    // Transform API pal response to internal format
    transformApiPal(apiPal) {
        return {
            type: 'palshub',
            id: apiPal.id,
            creator_id: apiPal.creator?.id || '', // Handle missing creator
            title: apiPal.title,
            description: apiPal.description,
            thumbnail_url: apiPal.thumbnail_url,
            system_prompt: apiPal.system_prompt,
            model_reference: apiPal.model_reference,
            model_settings: apiPal.model_settings || {},
            protection_level: apiPal.protection_level || 'public',
            price_cents: apiPal.price_cents,
            allow_fork: true, // Default value, not provided by API
            created_at: apiPal.created_at,
            updated_at: apiPal.updated_at || apiPal.created_at,
            // Computed fields
            creator: apiPal.creator
                ? {
                    id: apiPal.creator.id,
                    display_name: apiPal.creator.display_name,
                    avatar_url: apiPal.creator.avatar_url,
                    provider: 'unknown', // Default value
                    created_at: '', // Default value
                    updated_at: '', // Default value
                }
                : {
                    id: '',
                    display_name: '',
                    avatar_url: '',
                    provider: 'unknown',
                    created_at: '',
                    updated_at: '',
                },
            categories: apiPal.categories.map(cat => ({
                id: cat.id,
                name: cat.name,
                icon: cat.icon,
                sort_order: 0, // Default value
                created_at: '', // Default value
            })),
            tags: apiPal.tags.map(tag => ({
                id: tag.id,
                name: tag.name,
                usage_count: 0, // Default value
                created_at: '', // Default value
            })),
            average_rating: apiPal.stats.rating || undefined,
            review_count: apiPal.stats.review_count,
            is_owned: apiPal.is_owned,
            pact: apiPal.pact,
            greeting: apiPal.greeting,
            images: apiPal.images,
            models: apiPal.models,
            store_product_id: apiPal.store_product_id,
            iap_enabled: apiPal.iap_enabled,
            sample_exchange: parseSampleExchange(apiPal.sample_exchange),
        };
    }
    // Browse and search Pals
    async getPals(query = {}) {
        try {
            const params = new URLSearchParams();
            // Map query parameters to API format
            if (query.query) {
                params.set('q', query.query);
            }
            if (query.category_ids?.length) {
                params.set('category', query.category_ids[0]);
            }
            if (query.tag_names?.length) {
                params.set('tag', query.tag_names[0]);
            }
            if (query.price_min !== undefined) {
                params.set('price_min', query.price_min.toString());
            }
            if (query.price_max !== undefined) {
                params.set('price_max', query.price_max.toString());
            }
            if (query.sort_by) {
                // Map internal sort values to API format
                const sortMap = {
                    newest: 'newest',
                    oldest: 'oldest',
                    rating: 'popular', // Map rating to popular
                    popular: 'popular',
                    price_low: 'price_low',
                    price_high: 'price_high',
                };
                params.set('sort', sortMap[query.sort_by] || 'newest');
            }
            if (query.page) {
                params.set('page', query.page.toString());
            }
            if (query.limit) {
                params.set('limit', query.limit.toString());
            }
            const endpoint = `/api/mobile/pals${params.toString() ? `?${params.toString()}` : ''}`;
            const response = await this.apiRequest(endpoint);
            return {
                pals: response.pals.map(pal => this.transformApiPal(pal)),
                total_count: response.pagination.total,
                page: response.pagination.page,
                limit: response.pagination.limit,
                has_more: response.pagination.has_more,
            };
        }
        catch (error) {
            console.error('Failed to fetch pals:', error);
            if (error instanceof PalsHubError) {
                throw error;
            }
            throw new PalsHubError(`Failed to fetch pals: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    // Get detailed Pal information
    async getPal(id) {
        try {
            const response = await this.apiRequest(`/api/mobile/pals/${id}`);
            return this.transformApiPal(response);
        }
        catch (error) {
            if (error instanceof PalsHubError) {
                throw error;
            }
            throw new PalsHubError(`Failed to fetch pal: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    // Get user's library
    async getLibrary(query = {}) {
        if (!authService.user?.id) {
            throw new PalsHubError('User not authenticated - please sign in to access your library');
        }
        if (!authService.session?.access_token) {
            throw new PalsHubError('No valid session - please sign in again');
        }
        try {
            const params = new URLSearchParams();
            if (query.page) {
                params.set('page', query.page.toString());
            }
            if (query.limit) {
                params.set('limit', query.limit.toString());
            }
            if (query.filter) {
                params.set('filter', query.filter);
            }
            if (query.sort_by) {
                params.set('sort', query.sort_by);
            }
            const endpoint = `/api/mobile/library${params.toString() ? `?${params.toString()}` : ''}`;
            const response = await this.apiRequest(endpoint);
            return {
                pals: response.pals.map(pal => this.transformApiPal(pal)),
                total_count: response.pagination.total,
                page: response.pagination.page,
                limit: response.pagination.limit,
                has_more: response.pagination.has_more,
            };
        }
        catch (error) {
            if (error instanceof PalsHubError) {
                throw error;
            }
            throw new PalsHubError(`Failed to load library: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    // Get user's created Pals
    async getMyPals(query = {}) {
        if (!authService.user?.id) {
            throw new PalsHubError('User not authenticated - please sign in to access your pals');
        }
        if (!authService.session?.access_token) {
            throw new PalsHubError('No valid session - please sign in again');
        }
        try {
            const params = new URLSearchParams();
            if (query.page) {
                params.set('page', query.page.toString());
            }
            if (query.limit) {
                params.set('limit', query.limit.toString());
            }
            if (query.sort_by) {
                params.set('sort', query.sort_by);
            }
            const endpoint = `/api/mobile/my-pals${params.toString() ? `?${params.toString()}` : ''}`;
            const response = await this.apiRequest(endpoint);
            return {
                pals: response.pals.map(pal => this.transformApiPal(pal)),
                total_count: response.pagination.total,
                page: response.pagination.page,
                limit: response.pagination.limit,
                has_more: response.pagination.has_more,
            };
        }
        catch (error) {
            if (error instanceof PalsHubError) {
                throw error;
            }
            throw new PalsHubError(`Failed to load created pals: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    // Advanced search (alias for getPals)
    async searchPals(query) {
        return this.getPals(query);
    }
    // Categories and tags are embedded in pal responses, so these methods
    // extract unique values from cached data or make a simple pals request
    async getCategories() {
        try {
            // Get a small sample of pals to extract categories
            const response = await this.getPals({ limit: 50 });
            const categoriesMap = new Map();
            response.pals.forEach(pal => {
                pal.categories?.forEach(category => {
                    if (!categoriesMap.has(category.id)) {
                        categoriesMap.set(category.id, category);
                    }
                });
            });
            return {
                categories: Array.from(categoriesMap.values()),
            };
        }
        catch (error) {
            if (error instanceof PalsHubError) {
                throw error;
            }
            throw new PalsHubError(`Failed to fetch categories: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getTags(query = {}) {
        try {
            // Get a larger sample of pals to extract tags
            const response = await this.getPals({ limit: query.limit || 50 });
            const tagsMap = new Map();
            response.pals.forEach(pal => {
                pal.tags?.forEach(tag => {
                    if (!tagsMap.has(tag.id)) {
                        tagsMap.set(tag.id, tag);
                    }
                });
            });
            let tags = Array.from(tagsMap.values());
            // Apply search filter if provided
            if (query.query) {
                tags = tags.filter(tag => tag.name.toLowerCase().includes(query.query.toLowerCase()));
            }
            return { tags };
        }
        catch (error) {
            if (error instanceof PalsHubError) {
                throw error;
            }
            throw new PalsHubError(`Failed to fetch tags: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
export const palsHubApiService = new PalsHubApiService();
