import { StyleSheet } from 'react-native';
const sizeTokens = (theme, size) => {
    switch (size) {
        case 's':
            return { paddingVertical: theme.spacing.xxs };
        case 'l':
            return { paddingVertical: theme.spacing.s };
        case 'm':
        default:
            return { paddingVertical: theme.spacing.xs };
    }
};
export const createStyles = (theme, { variant, size, state, hasError }) => {
    const s = sizeTokens(theme, size);
    const borderColor = hasError
        ? theme.colors.error
        : state === 'focused'
            ? theme.colors.primary
            : theme.colors.outline;
    const root = {
        paddingHorizontal: theme.spacing.s,
        paddingVertical: s.paddingVertical,
        borderBottomWidth: theme.stroke.sm,
        borderBottomColor: borderColor,
        backgroundColor: 'transparent',
        flexDirection: 'row',
        alignItems: variant === 'multi' ? 'flex-start' : 'center',
        gap: theme.spacing.xs,
    };
    const input = {
        ...theme.typography.bodyM,
        color: state === 'disabled'
            ? theme.colors.onSurfaceVariant
            : theme.colors.onSurface,
        flex: 1,
        padding: 0,
        textAlignVertical: variant === 'multi' ? 'top' : 'auto',
    };
    const label = {
        ...theme.typography.captionS,
        color: theme.colors.onSurfaceVariant,
        marginBottom: theme.spacing.xxs,
    };
    const helper = {
        ...theme.typography.captionS,
        color: hasError ? theme.colors.error : theme.colors.onSurfaceVariant,
        marginTop: theme.spacing.xxs,
    };
    return StyleSheet.create({ root, input, label, helper });
};
