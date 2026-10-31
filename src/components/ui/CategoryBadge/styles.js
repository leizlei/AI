import { StyleSheet } from 'react-native';
const variantTokens = (theme, variant) => {
    switch (variant) {
        case 'primary':
            return {
                background: theme.colors.primaryContainer,
                foreground: theme.colors.onPrimaryContainer,
            };
        case 'secondary':
            return {
                background: theme.colors.secondaryContainer,
                foreground: theme.colors.onSecondaryContainer,
            };
        case 'tertiary':
            return {
                background: theme.colors.tertiaryContainer,
                foreground: theme.colors.onTertiaryContainer,
            };
        case 'neutral':
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
        borderRadius: theme.radius.xxs,
        backgroundColor: v.background,
        alignSelf: 'flex-start',
    };
    const label = {
        ...labelStyle,
        color: v.foreground,
    };
    return StyleSheet.create({ root, label });
};
