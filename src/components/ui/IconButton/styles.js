import { StyleSheet } from 'react-native';
const sizeTokens = (theme, size) => {
    switch (size) {
        case 's':
            return { padding: theme.spacing.xs, borderRadius: theme.radius.s };
        case 'l':
            return { padding: theme.spacing.s, borderRadius: theme.radius.m };
        case 'm':
        default:
            return { padding: theme.spacing.xs, borderRadius: theme.radius.s };
    }
};
const variantTokens = (theme, variant) => {
    switch (variant) {
        case 'standard':
            return { background: 'transparent' };
        case 'filled':
            return { background: theme.colors.primaryContainer };
        case 'outlined':
            return {
                background: 'transparent',
                border: theme.colors.outline,
            };
    }
};
export const createStyles = (theme, { variant, size, disabled }) => {
    const s = sizeTokens(theme, size);
    const v = disabled
        ? { background: theme.colors.surfaceContainerLow, border: undefined }
        : variantTokens(theme, variant);
    const root = {
        padding: s.padding,
        borderRadius: s.borderRadius,
        backgroundColor: v.background,
        alignItems: 'center',
        justifyContent: 'center',
        ...(v.border ? { borderWidth: theme.stroke.sm, borderColor: v.border } : {}),
    };
    return StyleSheet.create({ root });
};
