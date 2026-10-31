import { StyleSheet } from 'react-native';
export const styles = ({ theme }) => StyleSheet.create({
    // Tightened (Idea C): smaller icon + label + reduced vertical
    // padding so the chip reads as a metadata annotation rather than
    // a UI element competing with bubbles. No left padding — the
    // assistant row's marginLeft already provides the gutter, and
    // the chip aligns with the AI text body / footer at that edge.
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 0,
    },
    icon: {
        fontSize: 12,
        marginRight: 6,
        color: theme.colors.textSecondary,
        opacity: 0.75,
    },
    label: {
        fontSize: 11,
        color: theme.colors.textSecondary,
        opacity: 0.85,
    },
});
