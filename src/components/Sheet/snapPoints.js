const FULL_HEIGHT_TOP_GAP = 16;
export const fullHeightSnapPoint = (containerHeight, insetsTop) => containerHeight - insetsTop - FULL_HEIGHT_TOP_GAP;
export const resolveSnapPoints = (snapPoints, containerHeight, insetsTop) => {
    if (!Array.isArray(snapPoints)) {
        return snapPoints;
    }
    const maxHeight = fullHeightSnapPoint(containerHeight, insetsTop);
    return snapPoints.map(point => typeof point === 'string'
        ? Math.min((Number(point.split('%')[0]) * containerHeight) / 100, maxHeight)
        : point);
};
