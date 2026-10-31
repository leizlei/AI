const isRecord = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const names = (value) => Array.isArray(value)
    ? value.map(item => (isRecord(item) ? item.name : item))
    : value;
const projectPact = (value) => {
    if (!isRecord(value) || !Array.isArray(value.talents)) {
        return value;
    }
    return {
        talents: value.talents.map(talent => isRecord(talent)
            ? { name: talent.name, required: talent.required }
            : talent),
    };
};
const projectGreeting = (value) => isRecord(value)
    ? { text: value.text, suggested_prompts: value.suggested_prompts }
    : value;
const projectCreator = (raw) => {
    const creator = isRecord(raw.creator) ? raw.creator : {};
    return {
        id: raw.creator_id ?? creator.id,
        display_name: creator.display_name,
        avatar_url: creator.avatar_url,
    };
};
const PROJECT = {
    title: raw => raw.title,
    description: raw => raw.description,
    system_prompt: raw => raw.system_prompt,
    model_reference: raw => raw.model_reference,
    model_settings: raw => raw.model_settings,
    pact: raw => projectPact(raw.pact),
    greeting: raw => projectGreeting(raw.greeting),
    categories: raw => names(raw.categories),
    tags: raw => names(raw.tags),
    thumbnail_url: raw => raw.thumbnail_url,
    creator: projectCreator,
    protection_level: raw => raw.protection_level,
};
export const CREATOR_FIELDS = Object.keys(PROJECT);
export const projectCreatorContent = (raw) => Object.fromEntries(CREATOR_FIELDS.map(field => [field, PROJECT[field](raw)]));
export const normalise = (value) => {
    if (value === undefined || value === null || value === '') {
        return undefined;
    }
    if (Array.isArray(value)) {
        return value.length > 0
            ? value.map(item => normalise(item) ?? null)
            : undefined;
    }
    if (isRecord(value)) {
        const entries = Object.keys(value)
            .sort()
            .map(key => [key, normalise(value[key])])
            .filter(([, item]) => item !== undefined);
        return entries.length > 0 ? Object.fromEntries(entries) : undefined;
    }
    return value;
};
const sameValue = (a, b) => JSON.stringify(normalise(a)) === JSON.stringify(normalise(b));
export const changedCreatorFields = (applied, next) => new Set(CREATOR_FIELDS.filter(field => !applied || !sameValue(applied[field], next[field])));
