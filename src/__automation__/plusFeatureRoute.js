export const PLUS_FEATURE_URL = 'pocketpal://e2e/plus-feature';
export function isPlusFeatureUrl(url) {
    return typeof url === 'string' && url.split('?')[0] === PLUS_FEATURE_URL;
}
