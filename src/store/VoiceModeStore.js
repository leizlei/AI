import { Platform } from 'react-native';
import { makeAutoObservable } from 'mobx';
import { makePersistable } from 'mobx-persist-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isPlusUnlocked, openPlus } from '../services/plus/gate';
import { VoiceEntitlement, voiceModeDeviceSupported } from '../services/voice';
import { modelStore } from './ModelStore';
/**
 * State of the hands-free voice session in chat. `phase`, `micMuted` and
 * `lastError` are written only by `useVoiceMode`; the view and the bar
 * write `presentation`.
 */
export class VoiceModeStore {
    constructor() {
        this.phase = 'closed';
        this.micMuted = false;
        this.presentation = 'full';
        this.lastError = null;
        /** E2E builds only: forces the default entitlement either way. */
        this.unlockOverride = null;
        /** The Settings switch; null follows the device gate. */
        this.userVoiceModeOverride = null;
        makeAutoObservable(this, {}, { autoBind: true });
        makePersistable(this, {
            name: 'VoiceModeStore',
            properties: __E2E__
                ? ['userVoiceModeOverride', 'unlockOverride']
                : ['userVoiceModeOverride'],
            storage: AsyncStorage,
        });
    }
    /** The device meets voice mode's own gate (wider than dictation's). */
    get deviceSupported() {
        return voiceModeDeviceSupported(modelStore.deviceTier, Platform.OS);
    }
    /** Voice mode is offered: the user's choice, else the device gate. */
    get supported() {
        return this.userVoiceModeOverride ?? this.deviceSupported;
    }
    /** A session is open; changes only when one starts or ends. */
    get isOpen() {
        return this.phase !== 'closed';
    }
    /** The full voice view covers the chat. */
    get isFullViewOpen() {
        return this.phase !== 'closed' && this.presentation === 'full';
    }
    get isUnlocked() {
        return voiceEntitlement.source.isUnlocked();
    }
    /** `useVoiceMode` only. */
    setPhase(phase) {
        if (phase !== this.phase) {
            this.lastError = null;
        }
        this.phase = phase;
        if (phase === 'closed') {
            this.micMuted = false;
            this.presentation = 'full';
        }
    }
    /** `useVoiceMode` only. */
    setMicMuted(muted) {
        this.micMuted = muted;
    }
    /** `useVoiceMode` only. */
    setLastError(error) {
        this.lastError = error;
    }
    setPresentation(presentation) {
        this.presentation = presentation;
    }
    setUserVoiceModeOverride(enabled) {
        this.userVoiceModeOverride = enabled;
    }
    /** E2E drivers only. */
    setUnlockOverride(unlocked) {
        this.unlockOverride = unlocked;
    }
}
export const voiceModeStore = new VoiceModeStore();
export const voiceEntitlement = new VoiceEntitlement({
    isUnlocked: () => voiceModeStore.unlockOverride ?? isPlusUnlocked(),
    openPaywall: ({ onUnlocked }) => openPlus({ onUnlocked }),
});
