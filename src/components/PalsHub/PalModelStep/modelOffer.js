import { modelStore } from '../../../store';
import { hasEnoughMemory } from '../../../hooks/useMemoryCheck';
import { getModelMemoryRequirement } from '../../../utils/memoryEstimator';
const requirement = (model) => getModelMemoryRequirement(model);
const byRequirement = (a, b) => requirement(a) - requirement(b);
const offerFor = (model) => modelStore.isModelAvailable(model.id)
    ? { kind: 'ready', model }
    : { kind: 'download', model };
export const resolveModelOffer = async (localPal) => {
    const recommended = localPal.defaultModel
        ? (modelStore.models.find(m => m.id === localPal.defaultModel?.id) ??
            localPal.defaultModel)
        : undefined;
    if (recommended && modelStore.isModelAvailable(recommended.id)) {
        return { kind: 'ready', model: recommended };
    }
    if (recommended && (await hasEnoughMemory(recommended))) {
        return offerFor(recommended);
    }
    const candidates = modelStore.models.filter(m => m.isRulePreset || modelStore.isModelAvailable(m.id));
    const fitting = [];
    for (const candidate of candidates) {
        if (await hasEnoughMemory(candidate)) {
            fitting.push(candidate);
        }
    }
    if (fitting.length > 0) {
        return offerFor([...fitting].sort(byRequirement).at(-1));
    }
    const [smallest] = candidates.filter(m => m.isRulePreset).sort(byRequirement);
    return {
        kind: 'none',
        neededBytes: smallest ? requirement(smallest) : undefined,
    };
};
