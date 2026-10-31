import * as React from 'react';
import { Image, StyleSheet, TouchableOpacity, } from 'react-native';
import { useTheme } from '../../hooks';
import { L10nContext } from '../../utils';
export const AttachmentButton = ({ onPress, touchableOpacityProps, }) => {
    const l10n = React.useContext(L10nContext);
    const theme = useTheme();
    const handlePress = (event) => {
        onPress?.();
        touchableOpacityProps?.onPress?.(event);
    };
    return (<TouchableOpacity accessibilityLabel={l10n.components.attachmentButton.attachmentButtonAccessibilityLabel} accessibilityRole="button" testID="attachment-button" {...touchableOpacityProps} onPress={handlePress}>
      {theme.icons?.attachmentButtonIcon?.() ?? (<Image source={require('../../assets/icon-attachment.png')} style={[styles.image, { tintColor: theme.colors.onSurface }]}/>)}
    </TouchableOpacity>);
};
const styles = StyleSheet.create({
    image: {
        marginRight: 16,
    },
});
