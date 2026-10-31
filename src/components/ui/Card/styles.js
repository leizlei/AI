import { StyleSheet } from 'react-native';
const sizePadding = (theme, size) => {
    switch (size) {
        case 's':
            return theme.spacing.s;
        case 'l':
            return theme.spacing.l;
        case 'm':
        default:
            return theme.spacing.m;
    }
};
export const createStyles = (theme, { variant, size }) => {
    const padding = sizePadding(theme, size);
    const root = {
        padding,
        borderRadius: theme.radius.m,
        backgroundColor: theme.colors.surface,
        ...(variant === 'elevated' ? { elevation: 1 } : {}),
        ...(variant === 'outlined'
            ? { borderWidth: theme.stroke.sm, borderColor: theme.colors.outline }
            : {}),
    };
    return StyleSheet.create({
        root,
        listRoot: {
            padding,
            borderRadius: theme.radius.m,
            backgroundColor: theme.colors.surface,
        },
    });
};
