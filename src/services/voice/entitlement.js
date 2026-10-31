import { makeAutoObservable, observable } from 'mobx';
/**
 * The seam between voice mode and the purchase flow. Voice mode reads only
 * `source`; the purchase flow calls `register` once it can answer.
 */
export class VoiceEntitlement {
    constructor(defaultSource) {
        this.source = defaultSource;
        makeAutoObservable(this, { source: observable.ref });
    }
    register(source) {
        this.source = source;
    }
}
