import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../../hooks';
import { Button } from '../Button';
import { createStyles } from './styles';
/**
 * Standard CTA row shared by Sheet/Modal/Dialog. Up to two actions;
 * overlays needing more compose their own actions in the body.
 */
export const Actions = ({ primary, secondary, testID = 'ui-actions', }) => {
    const theme = useTheme();
    const styles = createStyles(theme);
    if (!primary && !secondary) {
        return null;
    }
    return (<View testID={testID} style={styles.actionsRoot}>
      {secondary ? (<Button variant="tertiary" label={secondary.label} onPress={secondary.onPress} disabled={secondary.disabled}/>) : null}
      {primary ? (<Button variant={primary.destructive ? 'destructive' : 'primary'} label={primary.label} onPress={primary.onPress} disabled={primary.disabled}/>) : null}
    </View>);
};
