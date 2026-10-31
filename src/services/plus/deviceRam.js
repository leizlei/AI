import { observable, runInAction } from 'mobx';
import { readDeviceSignals } from '../deviceRules/signals';
export const deviceRam = observable({ ramBytes: null });
let reading = null;
export const ensureRamRead = () => {
    if (!reading) {
        reading = readDeviceSignals().then(({ ramBytes }) => runInAction(() => {
            deviceRam.ramBytes = ramBytes;
        }));
    }
    return reading;
};
