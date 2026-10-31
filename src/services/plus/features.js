export const RAM_MARKETING_FACTOR = 0.85;
export const isShipped = (feature, override) => feature.shipped || override.has(feature.id);
export const meetsRam = (ramBytes, minRamGb) => ramBytes >= minRamGb * RAM_MARKETING_FACTOR * 1e9;
export const featureRows = (features, ramBytes, override, optIn = new Map()) => features.flatMap((feature) => {
    const { id, minRamGb } = feature;
    if (!isShipped(feature, override)) {
        return [{ id, status: 'soon' }];
    }
    const reason = optIn.get(id);
    const runnable = reason
        ? { id, status: 'optIn', reason }
        : { id, status: 'ready' };
    if (minRamGb === undefined) {
        return [runnable];
    }
    if (ramBytes === null) {
        return [];
    }
    return [
        meetsRam(ramBytes, minRamGb)
            ? runnable
            : { id, status: { needsGb: minRamGb } },
    ];
});
export const anyRunnable = (rows) => rows.some(row => row.status === 'ready' || row.status === 'optIn');
export const shippedFeatures = (features, override) => features.filter(feature => isShipped(feature, override));
