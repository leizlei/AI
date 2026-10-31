import { COMPLETION_PARAMS_METADATA, validateNumericField, } from '../../utils/modelSettings';
import { isLeftToServer, valueLeftToServer } from '../../utils/samplerParams';
export const stepOf = (name) => COMPLETION_PARAMS_METADATA[name]?.step ?? 0.01;
export const atControlPrecision = (name, value) => parseFloat(value.toFixed(Number.isInteger(stepOf(name)) ? 0 : 2));
const NONE = { kind: 'none' };
export function serverDefaultState(name, current, serverValue) {
    if (!Number.isFinite(current)) {
        return NONE;
    }
    const shown = serverValue === undefined
        ? undefined
        : atControlPrecision(name, serverValue);
    if (isLeftToServer(name, current)) {
        return { kind: 'omitted', shown };
    }
    if (shown === undefined) {
        return NONE;
    }
    if (atControlPrecision(name, current) === shown) {
        return { kind: 'matches' };
    }
    const leftToServer = valueLeftToServer(name);
    if (leftToServer !== undefined) {
        return { kind: 'reset', shown, resetTo: leftToServer };
    }
    const rule = COMPLETION_PARAMS_METADATA[name]?.validation;
    if (rule && !validateNumericField(shown, rule).isValid) {
        return NONE;
    }
    return { kind: 'reset', shown, resetTo: shown };
}
