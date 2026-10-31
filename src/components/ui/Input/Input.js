import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { useTheme } from '../../../hooks';
import { createStyles } from './styles';
/**
 * DS Input. Wraps RN TextInput with token-bound bottom-divider +
 * helper/error text + leading/trailing slots.
 *
 * Defaults: variant='single', size='m', testID='ui-input'. RN
 * TextInput owns its own a11y so accessibilityRole defaults to 'none'.
 */
export const Input = ({ testID = 'ui-input', accessibilityLabel, accessibilityHint, style, disabled, variant = 'single', size = 'm', label, helperText, errorText, leading, trailing, value, onChangeText, placeholder, multiline, inputProps, }) => {
    const theme = useTheme();
    const [focused, setFocused] = useState(false);
    const state = disabled ? 'disabled' : focused ? 'focused' : 'default';
    const styles = createStyles(theme, {
        variant,
        size,
        state,
        hasError: !!errorText,
    });
    return (<View style={style}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.root}>
        {leading}
        <TextInput testID={testID} accessibilityLabel={accessibilityLabel ?? label} accessibilityHint={accessibilityHint} editable={!disabled} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={theme.colors.onSurfaceVariant} multiline={multiline ?? variant === 'multi'} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={styles.input} {...inputProps}/>
        {trailing}
      </View>
      {(errorText ?? helperText) ? (<Text style={styles.helper}>{errorText ?? helperText}</Text>) : null}
    </View>);
};
