export const finiteNumber = (value) => typeof value === 'number' && Number.isFinite(value) ? value : undefined;
