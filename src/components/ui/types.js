/**
 * Dev-only runtime fallback for the case where types are bypassed
 * (dynamic prop spreads, generic wrappers, `any`-typed consumers).
 */
export function warnIfNoA11yLabel(componentName, label, accessibilityLabel) {
    if (__DEV__ && !label && !accessibilityLabel) {
        console.warn(`[ui/${componentName}] accessibilityLabel or label is required; types may have been bypassed.`);
    }
}
