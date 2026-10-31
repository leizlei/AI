import React, { useCallback, useRef } from 'react';
import { TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { styles } from './styles';
import { claimPlusReturnFocus, releasePlusReturnFocus } from './plusReturnFocus';
import { MenuIcon } from '../../assets/icons';
import { useTheme } from '../../hooks';
export const HeaderLeft = () => {
    const theme = useTheme();
    const navigation = useNavigation();
    const buttonRef = useRef(null);
    useFocusEffect(useCallback(() => {
        const node = buttonRef.current;
        claimPlusReturnFocus(node);
        return () => releasePlusReturnFocus(node);
    }, []));
    return (<TouchableOpacity ref={buttonRef} style={[styles.menuIcon]} testID="menu-button" accessibilityLabel="Open drawer" onPress={() => navigation.openDrawer()}>
      <MenuIcon stroke={theme.colors.primary}/>
    </TouchableOpacity>);
};
