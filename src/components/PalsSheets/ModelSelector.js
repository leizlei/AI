import React from 'react';
import { observer } from 'mobx-react-lite';
import { Selector } from '../Selector';
import { modelStore } from '../../store';
export const ModelSelector = observer(({ value, onChange, label, sublabel, placeholder = 'Select model', error, helperText, required, disabled, filter, testID, }) => {
    // Convert models to selector options
    const options = modelStore.availableModels
        .filter(model => (filter ? filter(model) : true))
        .map(model => ({
        label: model.name,
        value: model.id,
    }));
    const handleModelChange = (modelId) => {
        const selectedModel = modelStore.availableModels.find(model => model.id === modelId);
        if (selectedModel) {
            onChange(selectedModel);
        }
    };
    return (<Selector options={options} value={value?.id || ''} onChange={handleModelChange} label={label} sublabel={sublabel} placeholder={placeholder} disabled={disabled} required={required} error={error} helperText={helperText} testID={testID}/>);
});
