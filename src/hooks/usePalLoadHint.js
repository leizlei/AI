import { useEffect, useState } from 'react';
import { chatSessionStore, modelStore } from '../store';
import { talentRegistry } from '../services/talents';
// One-shot snackbar trigger when a pal with a heavy talent loads into a chat
// whose runtime n_ctx is below the talent's recommendation. Declarative only —
// reads recommendedContextTokens, never moves a banner trigger.
export const usePalLoadHint = ({ activePal, isFocused, }) => {
    const [hintVisible, setHintVisible] = useState(false);
    const nCtx = modelStore.activeContextSettings?.n_ctx;
    const palId = activePal?.id;
    const talentNames = (activePal?.pact?.talents ?? [])
        .map(ref => ref.name)
        .sort()
        .join(',');
    useEffect(() => {
        if (!isFocused || !palId || nCtx === undefined) {
            return;
        }
        const recommendation = (activePal?.pact?.talents ?? []).reduce((max, ref) => {
            const rec = talentRegistry.get(ref.name)?.recommendedContextTokens;
            return rec != null && rec > max ? rec : max;
        }, 0);
        if (recommendation <= nCtx) {
            return;
        }
        const signature = `${palId}|${nCtx}|${talentNames}`;
        if (chatSessionStore.palLoadHintSeen.has(signature)) {
            return;
        }
        chatSessionStore.markPalLoadHintSeen(signature);
        setHintVisible(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isFocused, palId, nCtx, talentNames]);
    return {
        hintVisible,
        dismiss: () => setHintVisible(false),
    };
};
