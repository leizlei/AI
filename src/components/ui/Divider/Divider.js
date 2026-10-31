import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../../hooks';
import { createStyles } from './styles';
/**
 * DS Divider. Single-thickness rule from theme.stroke.<thickness> with
 * theme.colors.outlineVariant.
 *
 * Defaults: variant='horizontal', thickness='sm', testID='ui-divider',
 * accessibilityRole='none'.
 */
export const Divider = ({ testID = 'ui-divider', accessibilityRole = 'none', accessibilityLabel, style, variant = 'horizontal', thickness = 'sm', }) => {
    const theme = useTheme();
    const styles = createStyles(theme, { variant, thickness });
    return (<View testID={testID} accessibilityRole={accessibilityRole} accessibilityLabel={accessibilityLabel} style={[styles.root, style]}/>);
};
