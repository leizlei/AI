import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useTheme } from '../../hooks';
import { createStyles } from './styles';
export const SuggestedPromptsRow = ({ prompts, onSelect, disabled = false, }) => {
    const theme = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    if (!prompts || prompts.length === 0) {
        return null;
    }
    return (<View testID="suggested-prompts-row">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {prompts.map((prompt, idx) => (<Pressable key={`${idx}-${prompt.slice(0, 16)}`} onPress={() => onSelect(prompt)} disabled={disabled} accessibilityRole="button" accessibilityState={{ disabled }} accessibilityLabel={`Use prompt: ${prompt}`} testID={`suggested-prompt-chip-${idx}`} style={({ pressed }) => [
                styles.chip,
                pressed && !disabled ? styles.chipPressed : null,
                disabled ? styles.chipDisabled : null,
            ]}>
            <Text style={styles.chipText} numberOfLines={2}>
              {prompt}
            </Text>
          </Pressable>))}
      </ScrollView>
    </View>);
};
