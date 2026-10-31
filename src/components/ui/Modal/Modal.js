import React from 'react';
import { View } from 'react-native';
import { Portal } from 'react-native-paper';
import { useTheme } from '../../../hooks';
import { Header } from '../Header';
import { Actions } from '../Sheet/Actions';
import { createStyles } from './styles';
/**
 * DS Modal — Portal + full-screen View + DS Header composition.
 * Renders a single Header; bespoke header markup is forbidden.
 *
 * Dismiss model: Modal is fullscreen, so there is no scrim region for
 * tap-to-dismiss. Consumers route `onDismiss` through a header close
 * button (leading/trailing slot) or platform back navigation. The prop
 * is exposed so the wiring is uniform across overlays.
 *
 * Defaults: testID='ui-modal'.
 */
const ModalBase = ({ testID = 'ui-modal', style, isVisible, title, subtitle, leading, trailing, align, children, }) => {
    const theme = useTheme();
    const styles = createStyles(theme);
    if (!isVisible) {
        return null;
    }
    return (<Portal>
      <View testID={testID} style={[styles.surface, style]}>
        {(title || subtitle || leading || trailing) && (<Header title={title} subtitle={subtitle} leading={leading} trailing={trailing} align={align}/>)}
        <View style={styles.body}>{children}</View>
      </View>
    </Portal>);
};
export const Modal = ModalBase;
Modal.Actions = Actions;
