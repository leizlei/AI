import { StyleSheet } from 'react-native';
export const createStyles = (theme) => StyleSheet.create({
    surface: {
        flex: 1,
        backgroundColor: theme.colors.surface,
    },
    body: {
        flex: 1,
        paddingHorizontal: theme.spacing.m,
        paddingVertical: theme.spacing.s,
    },
});
