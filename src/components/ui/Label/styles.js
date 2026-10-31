import { StyleSheet } from 'react-native';
const variantTokens = (theme, variant) => {
    switch (variant) {
        case 'status-success':
            return {
                background: theme.colors.secondaryContainer,
                foreground: theme.colors.onSecondaryContainer,
            };
        case 'status-warning':
            return {
                background: theme.colors.tertiaryContainer,
                foreground: theme.colors.onTertiaryContainer,
            };
        case 'status-error':
            return {
                background: theme.colors.errorContainer,
                foreground: theme.colors.onErrorContainer,
            };
        case 'status-info':
            return {
                background: theme.colors.primaryContainer,
                foreground: theme.colors.onPrimaryContainer,
            };
        case 'informational':
        default:
            return {
                background: theme.colors.surfaceContainer,
                foreground: theme.colors.onSurface,
            };
    }
};
export const createStyles = (theme, { variant, size }) => {
    const v = variantTokens(theme, variant);
    const labelStyle = size === 's' ? theme.typography.captionS : theme.typography.captionM;
    const root = {
        paddingHorizontal: size === 's' ? theme.spacing.xs : theme.spacing.s,
        paddingVertical: theme.spacing.xxs,
        borderRadius: theme.radius.xs,
        backgroundColor: v.background,
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: theme.spacing.xxs,
    };
    const label = {
        ...labelStyle,
        color: v.foreground,
    };
    return StyleSheet.create({ root, label });
};
