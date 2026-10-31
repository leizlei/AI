import { StyleSheet } from 'react-native';
export const createStyles = (theme) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 12,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: theme.colors.outline,
        opacity: 0.5,
    },
    text: {
        marginHorizontal: 12,
        color: theme.colors.onSurfaceVariant,
        fontSize: 14,
        fontWeight: '500',
    },
});
