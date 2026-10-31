import { StyleSheet } from 'react-native';
export const styles = ({ theme }) => StyleSheet.create({
    container: {
        paddingTop: 4,
        paddingBottom: 8,
        // No horizontal padding — aligns with the AI text / footer / chip
        // at the assistant row's marginLeft (single shared gutter).
    },
    text: {
        color: theme.colors.textSecondary,
        fontSize: 10,
    },
});
