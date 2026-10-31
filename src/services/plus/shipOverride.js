import { observable, runInAction } from 'mobx';
export const shipOverride = observable.box(new Set(), {
    deep: false,
});
export const setShipOverride = (featureIds) => {
    if (__E2E__) {
        runInAction(() => {
            shipOverride.set(new Set(featureIds));
        });
    }
};
