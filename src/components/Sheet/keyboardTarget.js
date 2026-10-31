import { runOnUI } from 'react-native-reanimated';
export const setKeyboardTarget = (state, tag) => {
    'worklet';
    return { ...state, target: tag };
};
export const clearOwnKeyboardTarget = (state, tag) => {
    'worklet';
    return state.target === tag ? { ...state, target: undefined } : state;
};
const applyKeyboardTargetUpdate = (keyboardState, update, tag) => {
    'worklet';
    const state = keyboardState.get();
    const next = update(state, tag);
    if (next !== state) {
        keyboardState.set(next);
    }
};
export const updateKeyboardTarget = (keyboardState, update, tag) => runOnUI(applyKeyboardTargetUpdate)(keyboardState, update, tag);
