const TIER_COPY = {
    base: { name: 'tierNameBase', hint: 'tierHintBase' },
    small: { name: 'tierNameSmall', hint: 'tierHintSmall' },
    'large-turbo': { name: 'tierNameLargeTurbo', hint: 'tierHintLargeTurbo' },
};
export const asrTierLabel = (tier, l10n) => l10n.voiceInput[TIER_COPY[tier].name];
export const asrTierHint = (tier, l10n) => l10n.voiceInput[TIER_COPY[tier].hint];
