const phaseOf = (inputs) => {
    if (inputs.plusUnlocked) {
        return 'purchased';
    }
    if (inputs.plusFlow === 'paying') {
        return 'paying';
    }
    if (inputs.plusPending) {
        return 'pending';
    }
    if (inputs.availability === 'unavailable') {
        return 'unavailable';
    }
    if (inputs.availability === 'initializing' ||
        !inputs.plusChecked ||
        (inputs.plusProductsLoading && inputs.productCount === 0) ||
        inputs.ramBytes === null) {
        return 'loading';
    }
    if (inputs.productCount === 0) {
        return 'unavailable';
    }
    return 'idle';
};
export const plusScreenState = (inputs) => {
    const phase = phaseOf(inputs);
    const buying = phase === 'idle' || phase === 'paying';
    return {
        phase,
        error: phase === 'idle' && inputs.lastBuyFailed,
        licence: buying && inputs.showsLicenseNotice,
        unsupported: buying && !inputs.anyFeatureRunnable,
    };
};
