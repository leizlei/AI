import React from 'react';
import { Pressable, View } from 'react-native';
import { Portal } from 'react-native-paper';
import { useTheme } from '../../../hooks';
import { Header } from '../Header';
import { Surface } from '../Surface';
import { Actions } from '../Sheet/Actions';
import { createStyles } from './styles';
/**
 * DS Dialog — Portal + centered Surface + DS Header composition.
 * Renders a single Header; bespoke header markup is forbidden.
 *
 * Defaults: testID='ui-dialog'.
 */
const DialogBase = ({ testID = 'ui-dialog', style, isVisible, onDismiss, dismissAccessibilityLabel, title, subtitle, leading, trailing, align, children, }) => {
    const theme = useTheme();
    const styles = createStyles(theme);
    if (!isVisible) {
        return null;
    }
    return (<Portal>
      <View style={styles.centerWrapper}>
        <Pressable accessibilityRole="button" accessibilityLabel={dismissAccessibilityLabel} onPress={onDismiss} style={styles.scrim}/>
        <Surface testID={testID} radius="l" elevation={3} style={[styles.surface, style]}>
          {(title || subtitle || leading || trailing) && (<Header title={title} subtitle={subtitle} leading={leading} trailing={trailing} align={align}/>)}
          <View style={styles.body}>{children}</View>
        </Surface>
      </View>
    </Portal>);
};
export const Dialog = DialogBase;
Dialog.Actions = Actions;
