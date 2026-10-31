import { StyleSheet } from 'react-native';
/**
 * Returns the state-layer overlay style for a given pressable state.
 *
 * The overlay is a transparent color with `theme.colors.pressedStateOpacity`.
 * It is the ONLY visual the Pressable primitive contributes; padding,
 * radius, background, etc. come from the consumer's outer style.
 * `focusStateOpacity` / `hoverStateOpacity` tokens still exist for
 * future consumer-driven focus/hover branches; the primitive itself
 * does not surface those states on mobile.
 */
export const createStateLayerStyle = (theme, { state, stateLayerColor }) => {
    if (state.disabled || !state.pressed) {
        return null;
    }
    const opacity = theme.colors.pressedStateOpacity;
    if (opacity === null || opacity === undefined) {
        return null;
    }
    return {
        ...StyleSheet.absoluteFill,
        backgroundColor: stateLayerColor,
        opacity,
    };
};
