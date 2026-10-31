import { StyleSheet } from 'react-native';
// Figma 896:29130: inactive 20x4, active 48x4, gap = Spacing/XS, Radius/XS.
export const INACTIVE_DOT_WIDTH = 20;
export const ACTIVE_DOT_WIDTH = 48;
export const DOT_HEIGHT = 4;
export const createStyles = (theme, isRTL) => {
    const root = {
        flexDirection: isRTL ? 'row-reverse' : 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: theme.spacing.xs,
    };
    const dotBase = {
        height: DOT_HEIGHT,
        borderRadius: theme.radius.xs,
    };
    return StyleSheet.create({ root, dotBase });
};
