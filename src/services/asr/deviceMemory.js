import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
/** The memory figure this platform budgets against, or null if unreadable. */
export async function readDeviceMemory(chat) {
    if (Platform.OS === 'ios') {
        return {
            os: 'ios',
            ceilingBytes: chat.availableMemoryCeiling ?? 0,
        };
    }
    try {
        return { os: 'android', totalBytes: await DeviceInfo.getTotalMemory() };
    }
    catch (err) {
        console.warn('[asr] memory read failed:', err);
        return null;
    }
}
