import React from 'react';
import { View } from 'react-native';
import { observer } from 'mobx-react';
import { plusGate } from '../../services/plus/gate';
import { scopeStyles } from './styles';
export const PlusA11yScope = observer(({ children }) => (<View testID="plus-a11y-scope" style={scopeStyles.scope} collapsable={false} importantForAccessibility={plusGate.request ? 'no-hide-descendants' : 'auto'}>
      {children}
    </View>));
