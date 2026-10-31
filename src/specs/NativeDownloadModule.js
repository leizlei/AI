import { Platform, TurboModuleRegistry } from 'react-native';
// Only load the module on Android
export default Platform.OS === 'android'
    ? TurboModuleRegistry.getEnforcing('DownloadModule')
    : null;
