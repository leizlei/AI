import { ttsStore } from '../../store';
import { hasVoiceFile } from '../tts/voiceFiles';
/**
 * Voice mode needs a neural voice the picker offers on this device: only
 * neural voices report which chunk plays.
 */
export const isVoiceModeVoice = (voice) => voice != null &&
    voice.engine !== 'system' &&
    ttsStore.isEngineOffered(voice.engine);
export const isVoiceModeVoiceReady = async (voice) => isVoiceModeVoice(voice) && hasVoiceFile(voice);
export { isMicGranted } from '../../utils/asrMicPermission';
