import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../../hooks';
import { createStyles } from './styles';
import { TabItem } from './TabItem';
/**
 * DS Tabs. Defaults: variant='underline', size='m', testID='ui-tabs',
 * accessibilityRole='tablist'. Each item is a Pressable with
 * accessibilityRole='tab' and selected state from `selectedValue`.
 */
export const Tabs = ({ testID = 'ui-tabs', accessibilityRole = 'tablist', accessibilityLabel, style, variant = 'underline', size = 'm', items, selectedValue, onChange, }) => {
    const theme = useTheme();
    const styles = createStyles(theme, { variant, size });
    return (<View testID={testID} accessibilityRole={accessibilityRole} accessibilityLabel={accessibilityLabel} style={[styles.root, style]}>
      {items.map(item => (<TabItem key={item.value} value={item.value} label={item.label} variant={variant} size={size} selected={item.value === selectedValue} disabled={item.disabled} onPress={onChange}/>))}
    </View>);
};
