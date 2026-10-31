/**
 * DeepLinkService
 *
 * Handles deep links from iOS Shortcuts and other sources
 */
import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
const { DeepLinkModule } = NativeModules;
class DeepLinkService {
    constructor() {
        this.eventEmitter = null;
        this.listeners = [];
        this.subscription = null;
        if (Platform.OS === 'ios' && DeepLinkModule) {
            this.eventEmitter = new NativeEventEmitter(DeepLinkModule);
        }
    }
    /**
     * Initialize the deep link service and start listening for deep links
     */
    initialize() {
        if (!this.eventEmitter) {
            return;
        }
        // Cleanup existing subscription first to prevent duplicates
        // This can happen during hot reload or if initialize() is called multiple times
        if (this.subscription) {
            console.log('DeepLinkService: Cleaning up existing subscription before re-initializing');
            this.subscription.remove();
            this.subscription = null;
        }
        // Listen for deep link events
        this.subscription = this.eventEmitter.addListener('onDeepLink', (params) => {
            console.log('Deep link received:', params);
            this.notifyListeners(params);
        });
        // Check for initial URL (app opened via deep link)
        this.checkInitialURL();
    }
    /**
     * Clean up listeners
     */
    cleanup() {
        if (this.subscription) {
            this.subscription.remove();
            this.subscription = null;
        }
        this.listeners = [];
    }
    /**
     * Add a deep link handler
     */
    addListener(handler) {
        this.listeners.push(handler);
        // Return a function to remove the listener
        return () => {
            this.listeners = this.listeners.filter(h => h !== handler);
        };
    }
    /**
     * Check if app was opened via deep link
     */
    async checkInitialURL() {
        if (!DeepLinkModule) {
            return;
        }
        try {
            const url = await DeepLinkModule.getInitialURL();
            if (url) {
                // Parse the URL and notify listeners
                const params = this.parseURL(url);
                if (params) {
                    this.notifyListeners(params);
                }
            }
        }
        catch (error) {
            console.error('Error getting initial URL:', error);
        }
    }
    /**
     * Parse a URL string into DeepLinkParams
     */
    parseURL(urlString) {
        try {
            const url = new URL(urlString);
            const queryParams = {};
            url.searchParams.forEach((value, key) => {
                queryParams[key] = value;
            });
            return {
                url: urlString,
                scheme: url.protocol.replace(':', ''),
                host: url.hostname,
                queryParams,
            };
        }
        catch (error) {
            console.error('Error parsing URL:', error);
            return null;
        }
    }
    /**
     * Notify all registered listeners
     */
    notifyListeners(params) {
        this.listeners.forEach(handler => {
            try {
                handler(params);
            }
            catch (error) {
                console.error('Error in deep link handler:', error);
            }
        });
    }
}
export const deepLinkService = new DeepLinkService();
