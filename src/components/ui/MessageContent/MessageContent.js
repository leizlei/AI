import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../../../hooks';
import { createStyles } from './styles';
/**
 * DS MessageContent — token-bound message bubble shell.
 *
 * Variants: user / assistant / system. Size axis is single ('m').
 *
 * Defaults: variant='assistant', size='m', testID='ui-message-content',
 * accessibilityRole='none'.
 */
export const MessageContent = ({ testID = 'ui-message-content', accessibilityRole = 'none', accessibilityLabel, style, variant = 'assistant', text, children, }) => {
    const theme = useTheme();
    const styles = createStyles(theme, variant);
    return (<View testID={testID} accessibilityRole={accessibilityRole} accessibilityLabel={accessibilityLabel} style={[styles.root, style]}>
      {text ? <Text style={styles.body}>{text}</Text> : null}
      {children}
    </View>);
};
