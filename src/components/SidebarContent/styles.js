import { StyleSheet } from 'react-native';
export const createStyles = (theme) => StyleSheet.create({
    sidebarContainer: {
        flex: 1,
        backgroundColor: theme.colors.surface,
    },
    divider: {
        marginHorizontal: 16,
        backgroundColor: theme.colors.onSurfaceVariant,
        height: 1,
        opacity: 0.1,
    },
    contentWrapper: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
    },
    sessionDrawerItem: {
        height: 40,
    },
    menuDrawerItem: {
        height: 44,
    },
    versionText: {
        color: theme.colors.onSurfaceVariant,
        opacity: 0.7,
        fontSize: 12,
        fontWeight: '500',
    },
    drawerSection: {
        marginTop: 10,
    },
    dateLabel: {
        paddingLeft: 16,
        paddingVertical: 10,
    },
    scrollViewContent: {
        flexGrow: 1,
        minHeight: '100%',
    },
    mainContent: {
        flex: 1,
    },
    menu: {
        width: 170,
    },
    sessionItem: {
        position: 'relative',
    },
    sessionTouchable: {
        flex: 1,
    },
    // Selection mode styles
    selectionModeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.outline,
        backgroundColor: theme.colors.surface,
    },
    selectedCountText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.onSurface,
        flex: 1,
        textAlign: 'center',
    },
    sessionItemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
    },
    sessionCheckbox: {
        marginLeft: 8,
        marginRight: 4,
    },
    menuDivider: {
        marginVertical: 4,
    },
    // Header action buttons (export, delete icons)
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    headerActionButton: {
        padding: 4,
    },
    headerActionButtonDisabled: {
        opacity: 0.4,
    },
    // Select all row
    selectAllRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: theme.colors.surface,
    },
    selectAllCheckbox: {
        marginRight: 12,
    },
    selectAllText: {
        fontSize: 16,
        color: theme.colors.onSurface,
    },
    selectAllDivider: {
        backgroundColor: theme.colors.outline,
        opacity: 0.3,
    },
    groupModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    groupModalContent: {
        width: '80%',
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: 20,
    },
    groupModalTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.onSurface,
        marginBottom: 12,
    },
    groupModalInput: {
        borderWidth: 1,
        borderColor: theme.colors.outline,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        color: theme.colors.onSurface,
        fontSize: 15,
        marginBottom: 16,
    },
    groupModalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    groupModalBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    groupModalBtnText: {
        color: theme.colors.onSurfaceVariant,
        fontSize: 15,
    },
    groupModalBtnTextPrimary: {
        color: theme.colors.primary,
        fontSize: 15,
        fontWeight: '600',
    },
});
