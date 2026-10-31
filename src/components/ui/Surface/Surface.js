import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../../hooks';
import { createStyles } from './styles';
/**
 * DS Surface — token-bound background + optional radius + Android
 * elevation. Pure visual primitive; consumers wrap their own shadow
 * specs when iOS shadows are wanted.
 *
 * Defaults: testID='ui-surface', accessibilityRole='none', radius='none',
 * elevation=1.
 */
export const Surface = ({ testID = 'ui-surface', accessibilityRole = 'none', accessibilityLabel, accessibilityHint, style, radius = 'none', elevation = 1, children, }) => {
    const theme = useTheme();
    const styles = createStyles(theme, { radius });
    return (<View testID={testID} accessibilityRole={accessibilityRole} accessibilityLabel={accessibilityLabel} accessibilityHint={accessibilityHint} style={[styles.root, { elevation }, style]}>
      {children}
    </View>);
};
