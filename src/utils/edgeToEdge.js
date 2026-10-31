import { Platform, TurboModuleRegistry } from 'react-native';
let isEdgeToEdge;
// RN's edge-to-edge flag makes measureInWindow include the status bar, which Paper otherwise adds on Android.
export const measuresIncludeStatusBar = () => {
    if (Platform.OS !== 'android') {
        return false;
    }
    if (isEdgeToEdge === undefined) {
        isEdgeToEdge =
            TurboModuleRegistry.get('DeviceInfo')?.getConstants()
                .isEdgeToEdge === true;
    }
    return isEdgeToEdge;
};
