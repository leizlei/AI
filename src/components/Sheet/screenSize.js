import { useSyncExternalStore } from 'react';
import { Dimensions } from 'react-native';
import { useSafeAreaFrame } from 'react-native-safe-area-context';
const listeners = new Set();
let subscription;
const notifyListeners = () => listeners.forEach(listener => listener());
const subscribeToScreen = (listener) => {
    listeners.add(listener);
    subscription ?? (subscription = Dimensions.addEventListener('change', notifyListeners));
    return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
            subscription?.remove();
            subscription = undefined;
        }
    };
};
const getScreenWidth = () => Dimensions.get('screen').width;
const getScreenHeight = () => Dimensions.get('screen').height;
const useScreenWidth = () => useSyncExternalStore(subscribeToScreen, getScreenWidth);
export const useScreenHeight = () => useSyncExternalStore(subscribeToScreen, getScreenHeight);
const sameLength = (a, b) => Math.abs(a - b) < 1;
export const useAppWindowFillsScreen = () => {
    const frame = useSafeAreaFrame();
    const screenWidth = useScreenWidth();
    const screenHeight = useScreenHeight();
    return (sameLength(Math.max(frame.width, frame.height), Math.max(screenWidth, screenHeight)) &&
        sameLength(Math.min(frame.width, frame.height), Math.min(screenWidth, screenHeight)));
};
