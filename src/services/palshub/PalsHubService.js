import { authService } from './AuthService';
import { palsHubApiService } from './PalsHubApiService';
export class PalsHubError extends Error {
    constructor(message, details) {
        super(message);
        this.details = details;
        this.name = 'PalsHubError';
    }
}
class PalsHubService {
    constructor() { }
    // Browse and search Pals - Using REST API
    async getPals(query = {}) {
        return palsHubApiService.getPals(query);
    }
    // Get detailed Pal information - Using REST API
    async getPal(id) {
        return palsHubApiService.getPal(id);
    }
    // Get user's library - Using REST API
    async getLibrary(query = {}) {
        return palsHubApiService.getLibrary(query);
    }
    // Get user's created Pals - Using REST API
    async getMyPals(query = {}) {
        return palsHubApiService.getMyPals(query);
    }
    // Advanced search
    async searchPals(query) {
        return this.getPals(query);
    }
    // Get all categories - Using REST API (extracted from pals data)
    async getCategories() {
        return palsHubApiService.getCategories();
    }
    // Get popular tags - Using REST API (extracted from pals data)
    async getTags(query = {}) {
        return palsHubApiService.getTags(query);
    }
    // Check if user owns a Pal - Using REST API
    async checkPalOwnership(palId) {
        try {
            if (!authService.user?.id) {
                return { owned: false };
            }
            // Get pal details which includes ownership information
            const pal = await this.getPal(palId);
            return {
                owned: pal.is_owned || false,
                purchase_date: undefined, // Purchase date not available in current API
            };
        }
        catch (error) {
            if (error instanceof PalsHubError) {
                throw error;
            }
            throw new PalsHubError(`Failed to check ownership: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
export const palsHubService = new PalsHubService();
