import React, { forwardRef } from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { Controller, useFormContext } from 'react-hook-form';
import { useTheme } from '../../hooks';
import { createStyles } from './styles';
import { TextInput } from '../TextInput';
const FormField = forwardRef(({ name, label, placeholder, multiline, required, sublabel, disabled, onSubmitEditing, }, ref) => {
    const theme = useTheme();
    const styles = createStyles(theme);
    const { control, formState: { errors }, } = useFormContext();
    return (<View style={styles.field}>
        <Text style={theme.fonts.titleMediumLight}>
          {label}
          {required && '*'}
        </Text>
        {sublabel && <Text style={styles.sublabel}>{sublabel}</Text>}
        <Controller control={control} name={name} render={({ field: { onChange, value } }) => (<TextInput testID={`form-field-${name}`} ref={ref} value={typeof value === 'string' ? value : ''} onChangeText={onChange} error={!!errors[name]} placeholder={placeholder} helperText={errors[name]?.message?.toString()} multiline={multiline} numberOfLines={multiline ? 5 : 1} editable={!disabled} onSubmitEditing={!multiline ? onSubmitEditing : undefined} returnKeyType={'default'}/>)}/>
      </View>);
});
FormField.displayName = 'FormField';
export { FormField };
