import { PHONON_VOICE_PINS } from '../../constants';
/**
 * The curated English voices. The id is the display name on both
 * platforms: the Android file stem the app saves, and the voice name in
 * the iOS Core ML bundle.
 */
export const PHONON_VOICES = PHONON_VOICE_PINS.map(pin => ({
    id: pin.name,
    name: pin.name,
    engine: 'phonon',
    language: pin.locale,
    gender: pin.gender === 'female' ? 'f' : 'm',
}));
