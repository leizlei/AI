/**
 * Clean capability detection functions
 * No inference, only explicit capability checks
 */
export const hasVideoCapability = (pal) => {
    return pal.capabilities?.video === true;
};
export const hasMultimodalCapability = (pal) => {
    return pal.capabilities?.multimodal === true;
};
export const hasRealtimeCapability = (pal) => {
    return pal.capabilities?.realtime === true;
};
export const hasAudioCapability = (pal) => {
    return pal.capabilities?.audio === true;
};
export const hasWebCapability = (pal) => {
    return pal.capabilities?.web === true;
};
export const hasCodeCapability = (pal) => {
    return pal.capabilities?.code === true;
};
export const hasMemoryCapability = (pal) => {
    return pal.capabilities?.memory === true;
};
export const hasToolsCapability = (pal) => {
    return pal.capabilities?.tools === true;
};
/**
 * Get all active capabilities for a pal
 */
export const getActiveCapabilities = (pal) => {
    if (!pal.capabilities) {
        return [];
    }
    return Object.entries(pal.capabilities)
        .filter(([_, enabled]) => enabled === true)
        .map(([capability, _]) => capability);
};
/**
 * Check if pal has any capabilities
 */
export const hasAnyCapabilities = (pal) => {
    return getActiveCapabilities(pal).length > 0;
};
/**
 * Create capabilities object from legacy pal type
 * Clean, explicit mapping with no inference
 */
export const createCapabilitiesFromLegacyType = (legacyType) => {
    switch (legacyType) {
        case 'video':
            return {
                video: true,
                multimodal: true,
            };
        case 'assistant':
        case 'roleplay':
        default:
            return {}; // No special capabilities
    }
};
