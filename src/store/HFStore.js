import { makeAutoObservable, runInAction } from 'mobx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { makePersistable } from 'mobx-persist-store';
import * as Keychain from 'react-native-keychain';
import { fetchGGUFSpecs, fetchModelFilesDetails, fetchModels } from '../api/hf';
import { enrichSiblingsWithStorage } from '../utils';
import { processHFSearchResults } from '../utils/hf';
import { createErrorState } from '../utils/errors';
// Service name for keychain storage
const HF_TOKEN_SERVICE = 'hf_token_service';
class HFStore {
    constructor() {
        this.models = [];
        this.isLoading = false;
        this.error = null;
        this.nextPageLink = null;
        this.lastFetchedNextLink = null;
        this.lastFetchMoreAttempt = 0;
        this.consecutiveSmallResults = 0;
        this.searchQuery = '';
        this.queryFilter = 'gguf,conversational';
        this.queryFull = true;
        this.queryConfig = true;
        this.hfToken = null;
        this.useHfToken = true; // Only applies when token is set
        // search filters
        this.searchFilters = {
            author: '',
            sortBy: 'relevance',
        };
        makeAutoObservable(this);
        makePersistable(this, {
            name: 'HFStore',
            properties: ['useHfToken'],
            storage: AsyncStorage,
        });
        // Load token from secure storage on initialization
        this.loadTokenFromSecureStorage();
    }
    // Load token from secure storage
    async loadTokenFromSecureStorage() {
        try {
            const credentials = await Keychain.getGenericPassword({
                service: HF_TOKEN_SERVICE,
            });
            if (credentials) {
                runInAction(() => {
                    this.hfToken = credentials.password;
                });
            }
        }
        catch (error) {
            console.error('Failed to load token from secure storage:', error);
        }
    }
    get isTokenPresent() {
        return !!this.hfToken && this.hfToken.trim().length > 0;
    }
    get shouldUseToken() {
        return this.isTokenPresent && this.useHfToken;
    }
    setUseHfToken(useToken) {
        runInAction(() => {
            this.useHfToken = useToken;
        });
    }
    async setToken(token) {
        try {
            // Save token in secure storage
            await Keychain.setGenericPassword('hf_token', token, {
                service: HF_TOKEN_SERVICE,
            });
            runInAction(() => {
                this.hfToken = token;
            });
            return true;
        }
        catch (error) {
            console.error('Failed to save HF token:', error);
            return false;
        }
    }
    async clearToken() {
        try {
            // Remove token from secure storage
            await Keychain.resetGenericPassword({
                service: HF_TOKEN_SERVICE,
            });
            runInAction(() => {
                this.hfToken = null;
            });
            return true;
        }
        catch (error) {
            console.error('Failed to clear HF token:', error);
            return false;
        }
    }
    setSearchQuery(query) {
        this.searchQuery = query;
    }
    setSearchFilters(filters) {
        if (filters.author !== undefined &&
            this.searchFilters.author !== filters.author) {
            this.searchFilters.author = filters.author;
        }
        if (filters.sortBy !== undefined &&
            this.searchFilters.sortBy !== filters.sortBy) {
            this.searchFilters.sortBy = filters.sortBy;
        }
    }
    setAuthorFilter(author) {
        this.searchFilters.author = author;
    }
    setSortBy(sortBy) {
        this.searchFilters.sortBy = sortBy;
    }
    clearFilters() {
        this.searchFilters = {
            author: '',
            sortBy: 'relevance',
        };
    }
    clearError() {
        this.error = null;
    }
    // Fetch the GGUF specs for a specific model,
    // such as number of parameters, context length, chat template, etc.
    async fetchAndSetGGUFSpecs(modelId) {
        try {
            const authToken = this.shouldUseToken ? this.hfToken : null;
            const specs = await fetchGGUFSpecs(modelId, authToken);
            const model = this.models.find(m => m.id === modelId);
            if (model) {
                runInAction(() => {
                    model.specs = specs;
                });
            }
        }
        catch (error) {
            console.error('Failed to fetch GGUF specs:', error);
            runInAction(() => {
                this.error = createErrorState(error, 'modelDetails', 'huggingface');
            });
        }
    }
    async updateSiblingsWithFileDetails(model, fileDetails) {
        const mergedSiblings = model.siblings.map(file => {
            const details = fileDetails.find(detail => detail.path === file.rfilename);
            if (!details) {
                return { ...file };
            }
            return {
                ...file,
                size: details.size,
                oid: details.oid,
                lfs: details.lfs,
            };
        });
        return enrichSiblingsWithStorage(model, mergedSiblings);
    }
    // Fetch the details (sizes, oid, lfs, ...) of the model files
    async fetchModelFileDetails(modelId) {
        try {
            console.log('Fetching model file details for', modelId);
            const authToken = this.shouldUseToken ? this.hfToken : null;
            const fileDetails = await fetchModelFilesDetails(modelId, authToken);
            const model = this.models.find(m => m.id === modelId);
            if (!model) {
                return;
            }
            const updatedSiblings = await this.updateSiblingsWithFileDetails(model, fileDetails);
            runInAction(() => {
                model.siblings = updatedSiblings;
            });
        }
        catch (error) {
            console.error('Error fetching model file sizes:', error);
            runInAction(() => {
                this.error = createErrorState(error, 'modelDetails', 'huggingface');
            });
        }
    }
    getModelById(id) {
        return this.models.find(model => model.id === id) || null;
    }
    async fetchModelData(modelId) {
        try {
            await this.fetchAndSetGGUFSpecs(modelId);
            await this.fetchModelFileDetails(modelId);
        }
        catch (error) {
            console.error('Error fetching model data:', error);
            runInAction(() => {
                this.error = createErrorState(error, 'modelDetails', 'huggingface');
            });
        }
    }
    get hasMoreResults() {
        return this.nextPageLink !== null;
    }
    // Check if we should prevent fetching more due to small result sets
    shouldPreventFetchMore() {
        const now = Date.now();
        const timeSinceLastAttempt = now - this.lastFetchMoreAttempt;
        // If we have very few models and recent attempts, apply debouncing
        if (this.models.length < 5 && timeSinceLastAttempt < 2000) {
            console.log('🔵 Preventing fetchMore: too few models and recent attempt');
            return true;
        }
        // If we've had multiple consecutive small results, be more cautious
        if (this.consecutiveSmallResults >= 3 && timeSinceLastAttempt < 5000) {
            console.log('🔵 Preventing fetchMore: multiple small results, applying longer debounce');
            return true;
        }
        return false;
    }
    // Helper method to build filter string based on current filters
    buildFilterString() {
        return this.queryFilter; // Just use the base filter
    }
    // Helper method to get sort parameters
    getSortParams() {
        switch (this.searchFilters.sortBy) {
            case 'lastModified':
                return { sort: 'lastModified', direction: '-1' };
            case 'likes':
                return { sort: 'likes', direction: '-1' };
            case 'downloads':
                return { sort: 'downloads', direction: '-1' };
            case 'relevance':
            default:
                return null; // No sorting - use HF's default relevance ranking
        }
    }
    // Fetch the models from the Hugging Face API
    async fetchModels() {
        this.isLoading = true;
        this.error = null;
        // Fresh search → reset pagination guards
        this.lastFetchedNextLink = null;
        this.consecutiveSmallResults = 0;
        this.lastFetchMoreAttempt = 0;
        try {
            const authToken = this.shouldUseToken ? this.hfToken : null;
            const sortParams = this.getSortParams();
            const { models, nextLink } = await fetchModels({
                search: this.searchQuery,
                author: this.searchFilters.author || undefined,
                limit: 10,
                sort: sortParams?.sort,
                direction: sortParams?.direction,
                filter: this.buildFilterString(),
                full: this.queryFull,
                config: this.queryConfig,
                authToken: authToken,
            });
            let processedModels = processHFSearchResults(models);
            runInAction(() => {
                this.models = processedModels;
                this.nextPageLink = nextLink;
            });
        }
        catch (error) {
            runInAction(() => {
                this.isLoading = false;
                this.nextPageLink = null;
                this.models = [];
            });
            // this need to be in a separate runInAction for the ui to render properly.
            runInAction(() => {
                this.error = createErrorState(error, 'search', 'huggingface');
            });
        }
        finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }
    // Fetch the next page of models
    async fetchMoreModels() {
        console.log('fetchMoreModels called');
        if (!this.nextPageLink || this.isLoading) {
            return;
        }
        // Check if we should prevent fetching more due to small result sets
        if (this.shouldPreventFetchMore()) {
            return;
        }
        // ⛔️ Don't refetch the same page over and over
        if (this.lastFetchedNextLink === this.nextPageLink) {
            console.log('🔵 Skipping duplicate fetch for same nextPageLink:', this.nextPageLink);
            return;
        }
        this.lastFetchedNextLink = this.nextPageLink;
        this.lastFetchMoreAttempt = Date.now();
        this.isLoading = true;
        this.error = null;
        try {
            const authToken = this.shouldUseToken ? this.hfToken : null;
            const { models, nextLink } = await fetchModels({
                nextPageUrl: this.nextPageLink,
                authToken: authToken,
            });
            let processedModels = processHFSearchResults(models);
            runInAction(() => {
                // Track consecutive small results for pagination protection
                if (processedModels.length < 3) {
                    this.consecutiveSmallResults++;
                }
                else {
                    this.consecutiveSmallResults = 0;
                }
                processedModels.forEach((model) => this.models.push(model));
                this.nextPageLink = nextLink;
            });
        }
        catch (error) {
            runInAction(() => {
                this.error = createErrorState(error, 'search', 'huggingface');
            });
        }
        finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }
}
export const hfStore = new HFStore();
