import { makeAutoObservable, runInAction } from 'mobx';
/**
 * DeepLinkStore
 *
 * Manages deep link state in a React-friendly way using MobX.
 * Replaces module-level state to avoid issues with Fast Refresh and module reloading.
 */
class DeepLinkStore {
    constructor() {
        this.pendingMessage = null;
        this.pendingHubRun = null;
        makeAutoObservable(this);
    }
    setPendingMessage(message) {
        runInAction(() => {
            this.pendingMessage = message;
        });
    }
    clearPendingMessage() {
        runInAction(() => {
            this.pendingMessage = null;
        });
    }
    setPendingHubRun(request) {
        runInAction(() => {
            this.pendingHubRun = request;
        });
    }
    clearPendingHubRun() {
        runInAction(() => {
            this.pendingHubRun = null;
        });
    }
}
export const deepLinkStore = new DeepLinkStore();
