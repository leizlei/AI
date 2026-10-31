import React from 'react';
import { Pressable as RNPressable, View, } from 'react-native';
import { useTheme } from '../../../../hooks';
import { createStateLayerStyle } from './styles';
/**
 * DS Pressable primitive. Wraps RN Pressable and renders a token-bound
 * state-layer overlay on press. Tokens-only; does NOT supply padding,
 * radius, or background — consumers wrap in their own styled View or
 * pass an outer style.
 */
export const Pressable = ({ style, stateLayerColor, disabled, children, ...rest }) => {
    const theme = useTheme();
    const overlayColor = stateLayerColor ?? theme.colors.onSurface;
    const isDisabled = disabled === true ? true : undefined;
    return (<RNPressable {...rest} disabled={disabled} accessibilityState={{
            ...(rest.accessibilityState ?? {}),
            ...(isDisabled ? { disabled: true } : {}),
        }} style={state => {
            const outer = typeof style === 'function'
                ? style({ pressed: state.pressed, disabled: isDisabled })
                : style;
            return outer;
        }}>
      {state => {
            const overlay = createStateLayerStyle(theme, {
                state: { pressed: state.pressed, disabled: isDisabled },
                stateLayerColor: overlayColor,
            });
            return (<>
            {children}
            {overlay ? (<View pointerEvents="none" testID="ui-pressable-state-layer" style={overlay}/>) : null}
          </>);
        }}
    </RNPressable>);
};
