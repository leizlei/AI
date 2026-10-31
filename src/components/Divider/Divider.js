import React from 'react';
import { Divider as PaperDivider } from 'react-native-paper';
import { useTheme } from '../../hooks';
import { createStyles } from './styles';
export const Divider = props => {
    const theme = useTheme();
    const styles = createStyles(theme);
    return <PaperDivider {...props} style={[styles.separator, props.style]}/>;
};
