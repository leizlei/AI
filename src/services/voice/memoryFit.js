import { ASR_TIERS } from '../asr/constants';
import { memoryBudget, whisperFits } from '../asr/whisperFits';
/**
 * Whether the chat model, whisper and the voice fit together. It won't fit
 * exactly where dictation would refuse whisper; it is tight when whisper
 * fits but the voice engine does not.
 */
export const voiceMemoryFit = ({ memory, chatBytes, sttTier, ttsBytes, }) => {
    if (!memory || (memory.os === 'ios' && memory.ceilingBytes === 0)) {
        return {
            status: 'fits',
            sttTier,
            breakdown: { rows: [], neededBytes: 0, availableBytes: 0 },
        };
    }
    const sttBytes = ASR_TIERS[sttTier].runtimeBytes;
    const rows = [
        { kind: 'chat', bytes: chatBytes },
        { kind: 'stt', bytes: sttBytes },
        { kind: 'tts', bytes: ttsBytes },
    ];
    const availableBytes = memoryBudget(memory);
    const neededBytes = rows.reduce((sum, row) => sum + row.bytes, 0);
    let status = 'fits';
    if (!whisperFits(memory, chatBytes, sttBytes)) {
        status = 'wont_fit';
    }
    else if (neededBytes > availableBytes) {
        status = 'tight';
    }
    return { status, sttTier, breakdown: { rows, neededBytes, availableBytes } };
};
