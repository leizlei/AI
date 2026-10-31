import { StyleSheet } from 'react-native';
export const createStyles = (theme, { variant, thickness }) => StyleSheet.create({
    root: {
        backgroundColor: theme.colors.outlineVariant,
        ...(variant === 'horizontal'
            ? { height: theme.stroke[thickness], alignSelf: 'stretch' }
            : { width: theme.stroke[thickness], alignSelf: 'stretch' }),
    },
});
