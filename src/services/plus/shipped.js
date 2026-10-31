import { PLUS_FEATURES } from './catalog';
import { deviceRam } from './deviceRam';
import { featureRows, shippedFeatures } from './features';
import { shipOverride } from './shipOverride';
import { voiceModeStore } from '../../store';
export const shippedPlusFeatures = () => shippedFeatures(PLUS_FEATURES, shipOverride.get());
const needsOptIn = () => new Map(voiceModeStore.supported
    ? []
    : [
        [
            'handsFreeVoice',
            voiceModeStore.deviceSupported ? 'offInSettings' : 'belowGate',
        ],
    ]);
export const plusFeatureRows = () => featureRows(PLUS_FEATURES, deviceRam.ramBytes, shipOverride.get(), needsOptIn());
