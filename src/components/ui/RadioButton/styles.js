import { StyleSheet } from 'react-native';
export const createStyles = (theme) => StyleSheet.create({
    root: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionRoot: {
        gap: theme.spacing.xs,
    },
    sectionLabel: {
        ...theme.typography.titleS,
        color: theme.colors.onSurface,
        marginBottom: theme.spacing.xxs,
    },
    sectionHelper: {
        ...theme.typography.captionS,
        color: theme.colors.onSurfaceVariant,
        marginBottom: theme.spacing.s,
    },
});
