import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Selector } from '..';
/**
 * Dynamic field for parameters with predefined options (single-select).
 */
export const DynamicOptionField = ({ parameter, disabled = false, error, }) => {
    const { control } = useFormContext();
    // Convert parameter options to selector options
    const options = (parameter.options || []).map(option => ({
        label: option,
        value: option,
    }));
    return (<Controller control={control} name={parameter.key} rules={{
            required: parameter.required ? `${parameter.label} is required` : false,
        }} render={({ field: { onChange, value } }) => (<Selector options={options} value={value || ''} onChange={onChange} label={parameter.label} sublabel={parameter.description} placeholder={`Select ${parameter.label.toLowerCase()}`} disabled={disabled} required={parameter.required} error={!!error} helperText={error} testID={`dynamic-option-${parameter.key}`}/>)}/>);
};
