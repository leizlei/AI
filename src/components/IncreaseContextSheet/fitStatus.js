// Pure, store-free three-zone fit classifier. Caller injects the estimator and
// the memory bounds so this stays free of MobX / device dependencies.
export const makeFitStatusFor = ({ memBytesFor, ceiling, totalMemory }) => (nCtx) => {
    const req = memBytesFor(nCtx);
    if (req <= ceiling) {
        return 'fits';
    }
    if (totalMemory > 0 && req <= totalMemory) {
        return 'tight';
    }
    return 'wont_fit';
};
// Gate for the banner's increase CTA: true iff at least one ladder tier above
// the current size, within the model's trained cap, fits the device. Mirrors
// the sheet's ladder filter so the CTA never opens a sheet with no real stop.
export const hasFittingUpgrade = (ladder, currentNCtx, modelMaxCtx, fitStatusFor) => ladder.some(tier => tier > currentNCtx &&
    tier <= modelMaxCtx &&
    fitStatusFor(tier) === 'fits');
