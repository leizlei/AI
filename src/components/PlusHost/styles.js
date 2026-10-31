import { StyleSheet } from 'react-native';
export const createStyles = (theme) => StyleSheet.create({
    root: {
        ...StyleSheet.absoluteFill,
        zIndex: 200,
        elevation: 8,
        backgroundColor: theme.colors.background,
    },
});
export const scopeStyles = StyleSheet.create({
    scope: {
        flex: 1,
    },
});
