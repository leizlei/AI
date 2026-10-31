import React, { useContext } from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { observer } from 'mobx-react-lite';
import { useTheme } from '../../hooks';
import { L10nContext, formatBytes } from '../../utils';
import { t } from '../../locales';
import { getModelMemoryRequirement } from '../../utils/memoryEstimator';
import { modelStore } from '../../store';
import { createStyles } from './styles';
/**
 * Display estimated memory requirement for a model
 *
 * Shows: "Estimated memory: ~2.5 GB"
 * Tappable with tooltip explaining the estimate.
 */
export const MemoryRequirement = observer(({ model, projectionModel }) => {
    const theme = useTheme();
    const l10n = useContext(L10nContext);
    const styles = createStyles(theme);
    // Get memory requirement
    const memoryRequirement = getModelMemoryRequirement(model, projectionModel, modelStore.memoryEstimateSettings);
    const sizeText = formatBytes(memoryRequirement, 1); // "2.5 GB"
    const displayText = t(l10n.memory.estimatedMemory, { size: sizeText });
    return (<View style={styles.container} testID="memory-requirement">
        <View style={styles.row} accessibilityLabel={displayText}>
          <Text variant="bodySmall" style={styles.text} testID="memory-requirement-text">
            {displayText}
          </Text>
        </View>
      </View>);
});
