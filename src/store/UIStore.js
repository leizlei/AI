import { Appearance } from 'react-native';
import { makePersistable } from 'mobx-persist-store';
import { makeAutoObservable, runInAction } from 'mobx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { l10n, supportedLanguages as localesSupportedLanguages, } from '../locales';
import { INITIAL_ONBOARDING_STATE, } from './onboarding/types';
export class UIStore {
    // List of supported languages (derived from locales registry)
    get supportedLanguages() {
        return localesSupportedLanguages;
    }
    setLastRagSources(sources) {
        runInAction(() => {
            this.lastRagSources = sources;
        });
    }
    hasWarnedToolCompat(modelId) {
        return this.toolCompatWarnedModels.includes(modelId);
    }
    markToolCompatWarned(modelId) {
        runInAction(() => {
            if (!this.toolCompatWarnedModels.includes(modelId)) {
                this.toolCompatWarnedModels.push(modelId);
            }
        });
    }
    showError(message) {
        // TODO: Implement error display logic (e.g., toast, alert, etc.)
        console.error(message);
    }
    setChatWarning(warning) {
        runInAction(() => {
            this.chatWarning = warning;
        });
    }
    clearChatWarning() {
        runInAction(() => {
            this.chatWarning = null;
        });
    }
    constructor() {
        this.pageStates = {
            modelsScreen: {
                filters: [],
                expandedGroups: {
                    [UIStore.GROUP_KEYS.READY_TO_USE]: true,
                },
            },
        };
        // This is a flag to auto-navigate to the chat page after loading a model
        this.autoNavigatetoChat = true;
        //colorScheme = useColorScheme();
        this.colorScheme = Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
        // Current selected language (default to English)
        this._language = 'en';
        this.displayMemUsage = false;
        this.iOSBackgroundDownloading = true;
        this.benchmarkShareDialog = {
            shouldShow: true,
        };
        // Warning state for chat-related warnings (like multimodal warnings)
        this.chatWarning = null;
        // Manual tool switches next to the thinking toggle: when enabled, the send
        // path forcibly retrieves local documents (doc) / runs web search (web) and
        // injects the excerpts, independent of whether the small local model decides
        // to issue the function call on its own.
        this.docSearchEnabled = false;
        this.webSearchEnabled = false;
        // Source documents referenced by the most recent doc-retrieval injection.
        // Carried on the assistant turn's metadata so the UI can show which files
        // the reply drew from ("RAG source preview").
        this.lastRagSources = [];
        // Models for which the tool-compatibility banner has already been shown.
        // Persisted so each model warns at most once per device.
        this.toolCompatWarnedModels = [];
        // Onboarding flow gating: persisted; default false on a fresh install.
        // Once flipped true, the OnboardingStack never re-mounts in this app
        // lifetime.
        this.hasCompletedOnboarding = false;
        // Frozen at onboarding completion; consumed by future Homepage
        // pal-suggestion surfaces. Never re-edited after the single write in
        // `completeOnboarding`.
        this.onboardingTopicsSnapshot = [];
        // Per-session, in-memory only. Reset on completion. Not persisted.
        this.onboardingState = { ...INITIAL_ONBOARDING_STATE };
        // Per-modelId dismissal of the download banner. Per-session — once the
        // download completes, the entry can be cleared so a fresh ready-to-load
        // state isn't pre-dismissed.
        this.dismissedDownloadIds = [];
        makeAutoObservable(this);
        makePersistable(this, {
            name: 'UIStore',
            properties: [
                'pageStates',
                'colorScheme',
                'autoNavigatetoChat',
                'displayMemUsage',
                'benchmarkShareDialog',
                '_language',
                'toolCompatWarnedModels',
                'hasCompletedOnboarding',
                'onboardingTopicsSnapshot',
                'docSearchEnabled',
                'webSearchEnabled',
            ],
            storage: AsyncStorage,
        });
        // backwards compatibility. Removed this from the ui settings screen.
        this.iOSBackgroundDownloading = true;
    }
    setValue(page, key, value) {
        runInAction(() => {
            if (this.pageStates[page]) {
                this.pageStates[page][key] = value;
            }
            else {
                console.error(`Page '${page}' does not exist in pageStates`);
            }
        });
    }
    setColorScheme(colorScheme) {
        runInAction(() => {
            this.colorScheme = colorScheme;
        });
    }
    setLanguage(language) {
        runInAction(() => {
            this._language = language;
        });
    }
    get language() {
        // If the language is not in l10n, return 'en'
        // This can happen when the app removes a language from l10n
        return this._language in l10n ? this._language : 'en';
    }
    get l10n() {
        return l10n[this.language];
    }
    setAutoNavigateToChat(value) {
        runInAction(() => {
            this.autoNavigatetoChat = value;
        });
    }
    setDisplayMemUsage(value) {
        runInAction(() => {
            this.displayMemUsage = value;
        });
    }
    setiOSBackgroundDownloading(value) {
        runInAction(() => {
            this.iOSBackgroundDownloading = value;
        });
    }
    setBenchmarkShareDialogPreference(shouldShow) {
        runInAction(() => {
            this.benchmarkShareDialog.shouldShow = shouldShow;
        });
    }
    setOnboardingStep(step) {
        runInAction(() => {
            this.onboardingState.currentStep = step;
        });
    }
    setOnboardingTopic(key) {
        runInAction(() => {
            this.onboardingState.selectedTopic = key;
        });
    }
    setOnboardingModelId(modelId) {
        runInAction(() => {
            this.onboardingState.selectedModelId = modelId;
        });
    }
    completeOnboarding({ topic, modelId: _modelId, }) {
        runInAction(() => {
            this.hasCompletedOnboarding = true;
            // Persisted snapshot stays as `TopicKey[]` for multi-tag headroom.
            // Derive from the new scalar: null → [], else [topic].
            this.onboardingTopicsSnapshot = topic === null ? [] : [topic];
            this.onboardingState = { ...INITIAL_ONBOARDING_STATE };
        });
    }
    // Test / E2E only — callers MUST gate with `__DEV__ || __E2E__`.
    resetOnboarding() {
        runInAction(() => {
            this.hasCompletedOnboarding = false;
            this.onboardingTopicsSnapshot = [];
            this.onboardingState = { ...INITIAL_ONBOARDING_STATE };
        });
    }
    // User-triggered replay (About → Show intro again). Re-enters the flow
    // without nuking the persisted topic snapshot; the user's next finish
    // will overwrite it. Distinct from `resetOnboarding` (dev/E2E nuke).
    replayOnboarding() {
        runInAction(() => {
            this.hasCompletedOnboarding = false;
            this.onboardingState = { ...INITIAL_ONBOARDING_STATE };
        });
    }
    isDownloadBannerDismissed(modelId) {
        return this.dismissedDownloadIds.includes(modelId);
    }
    dismissDownloadBanner(modelId) {
        runInAction(() => {
            if (!this.dismissedDownloadIds.includes(modelId)) {
                this.dismissedDownloadIds.push(modelId);
            }
        });
    }
    clearDownloadBannerDismissal(modelId) {
        runInAction(() => {
            this.dismissedDownloadIds = this.dismissedDownloadIds.filter(id => id !== modelId);
        });
    }
}
UIStore.GROUP_KEYS = {
    READY_TO_USE: 'ready_to_use',
    AVAILABLE_TO_DOWNLOAD: 'available_to_download',
};
export const uiStore = new UIStore();
