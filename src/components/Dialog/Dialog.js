import React from 'react';
import { Keyboard, TouchableWithoutFeedback, View, } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Button, Portal, Dialog as PaperDialog } from 'react-native-paper';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useTheme } from '../../hooks';
import { createStyles } from './styles';
export const Dialog = ({ testID, visible, onDismiss, title, children, actions = [], style, contentStyle, scrollAreaStyle, scrollable = false, scrollableBorderShown = false, dismissableBackButton = true, dismissable = true, avoidKeyboard = false, }) => {
    const theme = useTheme();
    const styles = createStyles(theme, scrollableBorderShown);
    const content = scrollable ? (<PaperDialog.ScrollArea style={[styles.dialogContent, contentStyle]}>
      {avoidKeyboard ? (<KeyboardAwareScrollView bottomOffset={10} style={[scrollAreaStyle]} 
        //keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled">
          {children}
        </KeyboardAwareScrollView>) : (<ScrollView style={scrollAreaStyle} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>)}
    </PaperDialog.ScrollArea>) : (<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <PaperDialog.Content style={[styles.dialogContent, contentStyle]}>
        {avoidKeyboard ? (<KeyboardAwareScrollView>{children}</KeyboardAwareScrollView>) : (children)}
      </PaperDialog.Content>
    </TouchableWithoutFeedback>);
    return (<Portal>
      <PaperDialog testID={testID} dismissableBackButton={dismissableBackButton} dismissable={dismissable} visible={visible} onDismiss={onDismiss} style={[styles.dialog, style]}>
        <PaperDialog.Title style={styles.dialogTitle}>
          {title}
        </PaperDialog.Title>
        <View>
          {content}
          {actions.length > 0 && (<PaperDialog.Actions style={styles.actionsContainer}>
              {actions.map(action => (<Button key={action.label} testID={action.testID} mode={action.mode || 'text'} onPress={action.onPress} loading={action.loading} disabled={action.disabled} style={styles.dialogActionButton}>
                  {action.label}
                </Button>))}
            </PaperDialog.Actions>)}
        </View>
      </PaperDialog>
    </Portal>);
};
