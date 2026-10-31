import { useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';
import { voiceVisual } from '../VoiceCloud';
/** The status title and subtitle for a cloud state; an error wins. */
export const voiceStatus = (phase, micMuted, error, strings) => {
    const key = phase === 'starting' ? 'starting' : voiceVisual(phase, micMuted);
    const title = strings[`${key}Title`];
    if (error === 'transcribe_failed') {
        return { title, hint: strings.errorTranscribe, isError: true };
    }
    if (error === 'reply_failed') {
        return { title, hint: strings.errorReply, isError: true };
    }
    if (error === 'speech_failed') {
        return { title, hint: strings.errorSpeech, isError: true };
    }
    return { title, hint: strings[`${key}Hint`], isError: false };
};
/** Speaks each new status, and any error, to a screen reader. */
export const useAnnounceVoiceStatus = (status, active) => {
    const message = status.isError
        ? `${status.title}. ${status.hint}`
        : status.title;
    useEffect(() => {
        if (active) {
            AccessibilityInfo.announceForAccessibilityWithOptions(message, {
                queue: true,
            });
        }
    }, [active, message]);
};
