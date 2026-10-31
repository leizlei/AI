import { StyleSheet } from 'react-native';
export const createStyles = (theme, { selected }) => StyleSheet.create({
    root: {
        flexDirection: 'row',
        alignItems: 'stretch',
        paddingVertical: theme.spacing.xs,
        backgroundColor: theme.colors.surface,
        borderTopWidth: theme.stroke.xs,
        borderTopColor: theme.colors.outlineVariant,
    },
    item: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.xs,
        gap: theme.spacing.xxs,
    },
    label: {
        ...theme.typography.captionS,
        color: selected ? theme.colors.primary : theme.colors.onSurfaceVariant,
    },
});
