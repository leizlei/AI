import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../../../hooks';
import { Pressable } from '../primitives/Pressable';
import { createStyles } from './styles';
export const TabItem = ({ value, label, variant, size, selected, disabled, onPress, testID, }) => {
    const theme = useTheme();
    const styles = createStyles(theme, { variant, size, selected, disabled });
    const resolvedTestID = testID ?? `ui-tab-item-${value}`;
    return (<Pressable testID={resolvedTestID} accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected, disabled: !!disabled }} disabled={disabled} onPress={() => onPress(value)} style={styles.item}>
      <Text style={styles.label}>{label}</Text>
      <View pointerEvents="none" style={styles.underline}/>
    </Pressable>);
};
