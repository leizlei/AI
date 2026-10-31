import { ANIMATION_CONFIGS, KEYBOARD_STATUS } from '@gorhom/bottom-sheet';
import { Easing, } from 'react-native-reanimated';
const BAR_PADDING = 10;
const LIFT_MARGIN = 1;
export const isLifted = (status, position, highestDetentPosition) => {
    'worklet';
    return (status === KEYBOARD_STATUS.SHOWN &&
        highestDetentPosition !== undefined &&
        position < highestDetentPosition - LIFT_MARGIN);
};
export const actionsBottomPadding = (insetBottom, { lifted, heightWithinContainer }) => {
    'worklet';
    const covered = lifted ? heightWithinContainer : 0;
    return BAR_PADDING + Math.max(0, insetBottom - covered);
};
export const keyboardAnimationConfig = (easing, duration) => {
    'worklet';
    switch (easing) {
        case 'easeIn':
            return { easing: Easing.in(Easing.ease), duration };
        case 'easeOut':
            return { easing: Easing.out(Easing.ease), duration };
        case 'easeInEaseOut':
            return { easing: Easing.inOut(Easing.ease), duration };
        case 'linear':
            return { easing: Easing.linear, duration };
        case 'keyboard':
            return {
                damping: 500,
                stiffness: 1000,
                mass: 3,
                overshootClamping: true,
            };
    }
    return ANIMATION_CONFIGS;
};
export const paddingUpdate = (prev, next) => {
    'worklet';
    const value = actionsBottomPadding(next.inset, next);
    if (prev === null) {
        return { value, method: 'set' };
    }
    const keyboardMoved = prev.lifted !== next.lifted ||
        prev.heightWithinContainer !== next.heightWithinContainer;
    if (prev.inset !== next.inset && !keyboardMoved) {
        return { value, method: 'set' };
    }
    if (value === actionsBottomPadding(prev.inset, prev)) {
        return { value, method: 'none' };
    }
    const config = keyboardAnimationConfig(next.easing, next.duration);
    return 'duration' in config || 'easing' in config
        ? { value, method: 'timing', config: config }
        : { value, method: 'spring', config: config };
};
