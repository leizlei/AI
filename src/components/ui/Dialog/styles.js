import { StyleSheet } from 'react-native';
export const createStyles = (theme) => StyleSheet.create({
    scrim: {
        ...StyleSheet.absoluteFill,
        backgroundColor: theme.colors.menuGroupSeparator,
    },
    centerWrapper: {
        ...StyleSheet.absoluteFill,
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.m,
    },
    surface: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.l,
        overflow: 'hidden',
    },
    body: {
        paddingHorizontal: theme.spacing.m,
        paddingVertical: theme.spacing.s,
    },
});
