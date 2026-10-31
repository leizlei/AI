import { StyleSheet } from 'react-native';
export const createStyles = (theme) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    checkbox: {
        borderWidth: 2,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkedBox: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primary,
    },
    uncheckedBox: {
        borderColor: theme.colors.outline,
        backgroundColor: 'transparent',
    },
});
