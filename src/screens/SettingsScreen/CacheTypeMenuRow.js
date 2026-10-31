import React from 'react';
import { View } from 'react-native';
import { Button, Icon, Text } from 'react-native-paper';
import { Menu } from '../../components';
const chevronDown = ({ size, color }) => (<Icon source="chevron-down" size={size} color={color}/>);
export const CacheTypeMenuRow = ({ menu, label, description, value, valueLabel, options, disabled, onSelect, styles, testID, }) => (<View style={styles.settingItemContainer}>
    <View style={styles.switchContainer}>
      <View style={styles.textContainer}>
        <Text variant="titleMedium" style={styles.textLabel}>
          {label}
        </Text>
        {description !== undefined && (<Text variant="labelSmall" style={styles.textDescription}>
            {description}
          </Text>)}
      </View>
      <View style={styles.menuContainer}>
        <Button ref={menu.buttonRef} mode="outlined" onPress={menu.open} style={styles.menuButton} contentStyle={styles.buttonContent} testID={testID} disabled={disabled} accessibilityLabel={`${label}, ${valueLabel}`} accessibilityHint={description} icon={chevronDown}>
          {valueLabel}
        </Button>
        <Menu visible={menu.visible} onDismiss={menu.close} anchor={menu.anchor} selectable>
          {options.map(option => (<Menu.Item key={option.value} style={styles.menu} label={option.label} selected={option.value === value} disabled={option.disabled} onPress={() => {
            if (!option.disabled) {
                onSelect(option.value);
                menu.close();
            }
        }}/>))}
        </Menu>
      </View>
    </View>
  </View>);
