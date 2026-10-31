import { modelStore } from '../store';
export const downloadModel = async (model) => {
    if (model.hfModel && model.hfModelFile) {
        await modelStore.downloadHFModel(model.hfModel, model.hfModelFile, {
            enableVision: true,
        });
    }
    else {
        await modelStore.checkSpaceAndDownload(model.id);
    }
};
