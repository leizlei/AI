import { StyleSheet } from 'react-native';
const sizeTokens = (theme, size) => {
    if (size === 's') {
        return {
            paddingHorizontal: theme.spacing.s,
            paddingVertical: theme.spacing.xxs,
            borderRadius: theme.radius.xs,
            labelStyle: theme.typography.captionS,
            gap: theme.spacing.xxs,
        };
    }
    return {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.radius.s,
        labelStyle: theme.typography.captionM,
        gap: theme.spacing.xs,
    };
};
const variantTokens = (theme, variant, selected, disabled) => {
    if (disabled) {
        return {
            background: theme.colors.surfaceContainerLow,
            foreground: theme.colors.onSurfaceVariant,
        };
    }
    if (variant === 'selectable' && selected) {
        return {
            background: theme.colors.secondaryContainer,
            foreground: theme.colors.onSecondaryContainer,
        };
    }
    if (variant === 'input') {
        return {
            background: theme.colors.surfaceContainerHigh,
            foreground: theme.colors.onSurface,
        };
    }
    return {
        background: theme.colors.surfaceContainer,
        foreground: theme.colors.onSurface,
    };
};
export const createStyles = (theme, { variant, size, selected, disabled }) => {
    const s = sizeTokens(theme, size);
    const v = variantTokens(theme, variant, !!selected, !!disabled);
    const root = {
        paddingHorizontal: s.paddingHorizontal,
        paddingVertical: s.paddingVertical,
        borderRadius: s.borderRadius,
        backgroundColor: v.background,
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: s.gap,
    };
    const label = {
        ...s.labelStyle,
        color: v.foreground,
    };
    return StyleSheet.create({ root, label });
};
