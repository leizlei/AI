export const revealOffset = ({ inputY, inputHeight, viewportHeight, offsetY, contentHeight, }) => {
    const target = Math.min(inputY + inputHeight - viewportHeight, contentHeight - viewportHeight);
    return target > offsetY ? target : null;
};
