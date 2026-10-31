let target = null;
export const claimPlusReturnFocus = (node) => {
    target = node;
};
export const releasePlusReturnFocus = (node) => {
    if (target === node) {
        target = null;
    }
};
export const plusReturnFocusTarget = () => target;
