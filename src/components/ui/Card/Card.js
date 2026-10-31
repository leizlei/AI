import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../../hooks';
import { Pressable } from '../primitives/Pressable';
import { createStyles } from './styles';
/**
 * DS Card. Token-bound View with radius + padding; optional elevation
 * (variant='elevated') or outline (variant='outlined'). When `onPress`
 * is supplied, wraps children in Pressable for the state-layer overlay.
 *
 * Defaults: variant='flat', size='m', testID='ui-card',
 * accessibilityRole='none'.
 */
export const Card = ({ testID = 'ui-card', accessibilityRole = 'none', accessibilityLabel, accessibilityHint, style, disabled, variant = 'flat', size = 'm', onPress, children, }) => {
    const theme = useTheme();
    const styles = createStyles(theme, { variant, size });
    if (onPress) {
        return (<Pressable testID={testID} accessibilityRole={accessibilityRole} accessibilityLabel={accessibilityLabel} accessibilityHint={accessibilityHint} disabled={disabled} onPress={onPress} style={[styles.root, style]}>
        {children}
      </Pressable>);
    }
    return (<View testID={testID} accessibilityRole={accessibilityRole} accessibilityLabel={accessibilityLabel} accessibilityHint={accessibilityHint} style={[styles.root, style]}>
      {children}
    </View>);
};
