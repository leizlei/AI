import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../../../hooks';
import { createStyles } from './styles';
/**
 * DS Label — Informational + Status. Pure visual primitive
 * (View + colored background + optional icon).
 *
 * Defaults: variant='informational', size='m', testID='ui-label',
 * accessibilityRole='text'.
 */
export const Label = ({ testID = 'ui-label', accessibilityRole = 'text', accessibilityLabel, style, variant = 'informational', size = 'm', label, leadingIcon, }) => {
    const theme = useTheme();
    const styles = createStyles(theme, { variant, size });
    return (<View testID={testID} accessibilityRole={accessibilityRole} accessibilityLabel={accessibilityLabel ?? label} style={[styles.root, style]}>
      {leadingIcon}
      <Text style={styles.label}>{label}</Text>
    </View>);
};
