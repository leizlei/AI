import { StyleSheet } from 'react-native';
export const styles = ({ theme }) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 12,
        gap: 5,
    },
    timing: {
        color: theme.colors.textSecondary,
        fontSize: 10,
    },
    interruptedStatus: {
        color: theme.colors.error,
        fontSize: 10,
    },
    ragSourceChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: theme.colors.surfaceVariant,
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
        maxWidth: 200,
    },
    ragSourceText: {
        color: theme.colors.textSecondary,
        fontSize: 10,
        flexShrink: 1,
    },
});
