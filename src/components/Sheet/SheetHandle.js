import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks';
export const SheetHandle = () => {
    const theme = useTheme();
    return (<View style={styles.container} testID="sheet-handle">
      <View style={[styles.indicator, { backgroundColor: theme.colors.primary }]}/>
    </View>);
};
const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
    },
    indicator: {
        width: 32,
        height: 4,
        borderRadius: 2,
    },
});
