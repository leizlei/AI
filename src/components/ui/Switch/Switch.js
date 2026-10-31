import React from 'react';
import { View } from 'react-native';
import { Switch as PaperSwitch } from 'react-native-paper';
import { useTheme } from '../../../hooks';
import { warnIfNoA11yLabel } from '../types';
import { createStyles } from './styles';
/**
 * DS Switch (wraps Paper Switch — Paper handles accessibilityRole
 * 'switch', accessibilityValue, and platform thumb-track behaviour).
 *
 * Defaults: variant='default', testID='ui-switch'. Size is owned by
 * Paper and not exposed on the DS surface.
 */
export const Switch = ({ testID = 'ui-switch', accessibilityLabel, accessibilityHint, style, disabled, variant: _variant = 'default', value, onValueChange, }) => {
    const theme = useTheme();
    warnIfNoA11yLabel('Switch', undefined, accessibilityLabel);
    const styles = createStyles(theme);
    return (<View testID={testID} style={[styles.root, style]}>
      <PaperSwitch value={value} onValueChange={onValueChange} disabled={disabled} color={theme.colors.primary} accessibilityLabel={accessibilityLabel} accessibilityHint={accessibilityHint}/>
    </View>);
};
