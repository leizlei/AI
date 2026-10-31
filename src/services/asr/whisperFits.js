import { ASR_ANDROID_RAM_SHARE, ASR_IOS_CEILING_SHARE } from './constants';
/** What Android lets the chat model and the speech models use together. */
export const androidMemoryBudget = (totalBytes) => totalBytes * ASR_ANDROID_RAM_SHARE;
/** The bytes the chat model and the speech models may use together. */
export const memoryBudget = (memory) => memory.os === 'ios'
    ? memory.ceilingBytes * ASR_IOS_CEILING_SHARE
    : androidMemoryBudget(memory.totalBytes);
/** Whether whisper fits next to the loaded chat model; an unknown iOS ceiling fits. */
export const whisperFits = (memory, chatBytes, whisperBytes) => (memory.os === 'ios' && memory.ceilingBytes === 0) ||
    chatBytes + whisperBytes <= memoryBudget(memory);
