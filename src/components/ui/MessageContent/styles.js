import { StyleSheet } from 'react-native';
const variantTokens = (theme, variant) => {
    switch (variant) {
        case 'user':
            return {
                background: theme.colors.primaryContainer,
                foreground: theme.colors.onPrimaryContainer,
                alignSelf: 'flex-end',
            };
        case 'system':
            return {
                background: theme.colors.surfaceContainerLow,
                foreground: theme.colors.onSurfaceVariant,
                alignSelf: 'center',
            };
        case 'assistant':
        default:
            return {
                background: theme.colors.surfaceContainer,
                foreground: theme.colors.onSurface,
                alignSelf: 'flex-start',
            };
    }
};
export const createStyles = (theme, variant) => {
    const v = variantTokens(theme, variant);
    const root = {
        paddingHorizontal: theme.spacing.m,
        paddingVertical: theme.spacing.s,
        borderRadius: theme.radius.ml,
        backgroundColor: v.background,
        alignSelf: v.alignSelf,
        maxWidth: '85%',
    };
    const body = {
        ...theme.typography.bodyM,
        color: v.foreground,
    };
    return StyleSheet.create({ root, body });
};
