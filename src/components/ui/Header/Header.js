import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../../../hooks';
import { createStyles } from './styles';
/**
 * Header — the shared building block for every DS overlay
 * (Sheet, Modal, Dialog). Every DS overlay MUST compose `<Header>`;
 * bespoke header markup inside an overlay is forbidden.
 *
 * Defaults: testID='ui-header', accessibilityRole='header',
 * align='leading'.
 */
export const Header = ({ testID = 'ui-header', accessibilityRole = 'header', accessibilityLabel, accessibilityHint, style, title, subtitle, leading, trailing, align = 'leading', }) => {
    const theme = useTheme();
    const styles = createStyles(theme);
    const centerLayout = align === 'center';
    return (<View testID={testID} accessibilityRole={accessibilityRole} accessibilityLabel={accessibilityLabel} accessibilityHint={accessibilityHint} style={[styles.root, centerLayout && styles.rootCenter, style]}>
      {leading ? <View style={styles.leadingSlot}>{leading}</View> : null}
      <View style={centerLayout ? styles.titleColumnCenter : styles.titleColumn}>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {trailing ? <View style={styles.trailingSlot}>{trailing}</View> : null}
    </View>);
};
