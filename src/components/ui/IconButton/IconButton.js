import React from 'react';
import { useTheme } from '../../../hooks';
import { Pressable } from '../primitives/Pressable';
import { warnIfNoA11yLabel } from '../types';
import { createStyles, } from './styles';
/**
 * DS IconButton. Icon-only Pressable with token-bound padding /
 * radius / colors. No Paper IconButton.
 *
 * Defaults: variant='standard', size='m', testID='ui-icon-button',
 * accessibilityRole='button'.
 */
export const IconButton = ({ testID = 'ui-icon-button', accessibilityRole = 'button', accessibilityLabel, accessibilityHint, style, disabled, variant = 'standard', size = 'm', icon, onPress, }) => {
    warnIfNoA11yLabel('IconButton', undefined, accessibilityLabel);
    const theme = useTheme();
    const styles = createStyles(theme, { variant, size, disabled });
    return (<Pressable testID={testID} accessibilityRole={accessibilityRole} accessibilityLabel={accessibilityLabel} accessibilityHint={accessibilityHint} disabled={disabled} onPress={onPress} style={[styles.root, style]}>
      {icon}
    </Pressable>);
};
