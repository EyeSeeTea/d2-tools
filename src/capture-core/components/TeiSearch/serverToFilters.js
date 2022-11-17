//
import { dataElementTypes } from "../../metaData";

const equals = (value, elementId) => `${elementId}:eq:${value}`;
const like = (value, elementId) => `${elementId}:like:${value}`;

function convertRange(value, elementId) {
    return `${elementId}:ge:${value.from}:le:${value.to}`;
}

const valueConvertersForType = {
    [dataElementTypes.TEXT]: like,
    [dataElementTypes.NUMBER_RANGE]: convertRange,
    [dataElementTypes.DATE_RANGE]: convertRange,
    [dataElementTypes.DATETIME_RANGE]: convertRange,
    [dataElementTypes.TIME_RANGE]: convertRange,
};

export function convertValue(value, type, metaElement) {
    if (!value && value !== 0 && value !== false) {
        return value;
    }
    // $FlowFixMe dataElementTypes flow error
    return valueConvertersForType[type]
        ? valueConvertersForType[type](value, metaElement.id)
        : equals(value, metaElement.id);
}

export function convertValueToEqual(value, type, metaElement) {
    if (!value && value !== 0 && value !== false) {
        return value;
    }
    return equals(value, metaElement.id);
}
