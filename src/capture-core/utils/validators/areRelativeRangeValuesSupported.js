//

export const areRelativeRangeValuesSupported = (startBuffer, endBuffer) =>
    startBuffer !== undefined &&
    startBuffer !== null &&
    Number.isInteger(startBuffer) &&
    startBuffer <= 0 &&
    endBuffer !== undefined &&
    endBuffer !== null &&
    Number.isInteger(endBuffer) &&
    endBuffer >= 0;
