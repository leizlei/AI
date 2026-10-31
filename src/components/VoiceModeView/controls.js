import { createContext, useContext } from 'react';
const noop = () => { };
/** The running voice session's actions, provided by the chat screen. */
export const VoiceModeControlsContext = createContext({
    tapCloud: noop,
    toggleMute: noop,
    end: noop,
});
export const useVoiceModeControls = () => useContext(VoiceModeControlsContext);
