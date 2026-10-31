export const createTableStyles = (theme) => ({
    tableOuter: {
        borderWidth: 1,
        borderColor: theme.colors.outline,
        borderRadius: 4,
        marginVertical: 8,
        overflow: 'hidden',
    },
    tableInner: {
        minWidth: '100%',
    },
    row: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.outline,
    },
    lastRow: {
        borderBottomWidth: 0,
    },
    headerRow: {
        backgroundColor: theme.colors.surfaceContainerHigh,
    },
    cell: {
        width: 100,
        flexGrow: 1,
        flexShrink: 0,
        padding: 4,
    },
    headerCell: {
        backgroundColor: theme.colors.surfaceContainerHigh,
        fontWeight: 'bold',
    },
    cellBorderRight: {
        borderRightWidth: 1,
        borderRightColor: theme.colors.outline,
    },
    alignLeft: {
        alignItems: 'flex-start',
    },
    alignCenter: {
        alignItems: 'center',
    },
    alignRight: {
        alignItems: 'flex-end',
    },
});
