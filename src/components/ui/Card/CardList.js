import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../../hooks';
import { createStyles } from './styles';
/**
 * DS CardList — Card sub-namespace optimized for list use. Same body
 * as Card but no elevation (single 'default' variant).
 *
 * Defaults: size='m', testID='ui-card-list',
 * accessibilityRole='none'.
 */
export const CardList = ({ testID = 'ui-card-list', accessibilityRole = 'none', accessibilityLabel, accessibilityHint, style, size = 'm', children, }) => {
    const theme = useTheme();
    const styles = createStyles(theme, { variant: 'flat', size });
    return (<View testID={testID} accessibilityRole={accessibilityRole} accessibilityLabel={accessibilityLabel} accessibilityHint={accessibilityHint} style={[styles.listRoot, style]}>
      {children}
    </View>);
};
