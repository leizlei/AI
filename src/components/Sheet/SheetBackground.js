import React from 'react';
import { StyleSheet, View } from 'react-native';
export const SheetBackground = ({ style }) => (<View accessible accessibilityRole="adjustable" accessibilityLabel="Bottom Sheet" style={[styles.background, style]}/>);
const styles = StyleSheet.create({
    background: {
        backgroundColor: 'white',
        borderRadius: 15,
    },
});
