import React from 'react';
import { Text } from 'react-native';
import { useTheme } from '../../../hooks';
import { Pressable } from '../primitives/Pressable';
import { warnIfNoA11yLabel } from '../types';
import { createStyles } from './styles';
/**
 * DS Button. Built on Pressable + token styles; no react-native-paper.
 *
 * Defaults: variant='primary', size='m', testID='ui-button',
 * accessibilityRole='button'. `label` or `accessibilityLabel` (or
 * both) is required at every call-site.
 */
export const Button = props => {
    const theme = useTheme();
    const { testID = 'ui-button', accessibilityRole = 'button', accessibilityLabel, accessibilityHint, style, disabled, variant = 'primary', size = 'm', label, onPress, children, } = props;
    warnIfNoA11yLabel('Button', label, accessibilityLabel);
    const styles = createStyles(theme, { variant, size, disabled });
    return (<Pressable testID={testID} accessibilityRole={accessibilityRole} accessibilityLabel={accessibilityLabel ?? label} accessibilityHint={accessibilityHint} disabled={disabled} onPress={onPress} style={[styles.root, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {children}
    </Pressable>);
};
