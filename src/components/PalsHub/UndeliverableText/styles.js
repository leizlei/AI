import { StyleSheet } from 'react-native';
export const createStyles = (theme) => StyleSheet.create({
    link: {
        color: theme.colors.primary,
        textDecorationLine: 'underline',
    },
});
