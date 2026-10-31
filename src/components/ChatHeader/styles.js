import { StyleSheet } from 'react-native';
export const createStyles = ({ theme, insets, headerHeight, }) => StyleSheet.create({
    container: {
        height: headerHeight,
        paddingTop: insets.top,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 10,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flexShrink: 1,
    },
    menuIcon: {
        height: 40,
        width: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerWithoutDivider: {
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 0,
        backgroundColor: theme.colors.background,
    },
    headerWithDivider: {
        backgroundColor: theme.colors.background,
    },
});
