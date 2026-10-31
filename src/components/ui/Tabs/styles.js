import { StyleSheet } from 'react-native';
const sizeTokens = (theme, size) => {
    if (size === 's') {
        return {
            paddingHorizontal: theme.spacing.s,
            paddingVertical: theme.spacing.xs,
            labelStyle: theme.typography.uiS,
        };
    }
    return {
        paddingHorizontal: theme.spacing.m,
        paddingVertical: theme.spacing.s,
        labelStyle: theme.typography.uiM,
    };
};
export const createStyles = (theme, { variant, size, selected, disabled }) => {
    const s = sizeTokens(theme, size);
    const item = {
        paddingHorizontal: s.paddingHorizontal,
        paddingVertical: s.paddingVertical,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        ...(variant === 'pill'
            ? {
                borderRadius: theme.radius.l,
                backgroundColor: selected
                    ? theme.colors.secondaryContainer
                    : 'transparent',
            }
            : {}),
    };
    const label = {
        ...s.labelStyle,
        color: disabled
            ? theme.colors.onSurfaceVariant
            : selected
                ? theme.colors.primary
                : theme.colors.onSurfaceVariant,
    };
    const underline = {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: theme.stroke.md,
        backgroundColor: variant === 'underline' && selected
            ? theme.colors.primary
            : 'transparent',
    };
    return StyleSheet.create({
        root: { flexDirection: 'row', alignItems: 'stretch' },
        item,
        label,
        underline,
    });
};
