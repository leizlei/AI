import { StyleSheet } from 'react-native';
export const createStyles = (theme) => StyleSheet.create({
    menu: {
        maxWidth: '90%',
        marginTop: 0,
        marginLeft: 0,
    },
    content: {
        paddingVertical: 0,
        backgroundColor: theme.colors.menuBackground,
        borderRadius: 12,
        //overflow: 'hidden', This removes shadow
    },
});
