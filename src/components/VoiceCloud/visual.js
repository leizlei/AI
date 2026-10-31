export const voiceVisual = (phase, micMuted) => {
    if (phase === 'speaking') {
        return 'speaking';
    }
    if (phase === 'starting' ||
        phase === 'transcribing' ||
        phase === 'thinking') {
        return 'thinking';
    }
    return micMuted ? 'muted' : 'listening';
};
