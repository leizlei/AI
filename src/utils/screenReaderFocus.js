import { AccessibilityInfo, Platform } from 'react-native';
export const moveScreenReaderFocus = (target) => AccessibilityInfo.sendAccessibilityEvent(target, Platform.OS === 'android' ? 'viewHoverEnter' : 'focus');
