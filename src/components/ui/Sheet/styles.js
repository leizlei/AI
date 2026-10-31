import { StyleSheet } from 'react-native';
export const createStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.surface,
    },
    body: {
        paddingHorizontal: theme.spacing.m,
        paddingVertical: theme.spacing.s,
    },
    actionsRoot: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: theme.spacing.s,
        paddingHorizontal: theme.spacing.m,
        paddingVertical: theme.spacing.s,
    },
});
