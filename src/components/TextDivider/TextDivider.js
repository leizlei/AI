import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTheme } from '../../hooks';
import { createStyles } from './styles';
export const TextDivider = ({ text, style, textStyle, }) => {
    const theme = useTheme();
    const styles = createStyles(theme);
    return (<View style={[styles.container, style]}>
      <View style={styles.line}/>
      <Text style={[styles.text, textStyle]}>{text}</Text>
      <View style={styles.line}/>
    </View>);
};
