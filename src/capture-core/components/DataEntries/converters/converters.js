//

export function convertGeometryOut(dataEntryValue, foundation) {
    if (!dataEntryValue || !["Polygon", "Point"].includes(foundation.featureType)) return null;
    let coordinates = dataEntryValue;
    if (foundation.featureType === "Point") {
        coordinates = [dataEntryValue.longitude, dataEntryValue.latitude];
    }
    return {
        type: foundation.featureType,
        coordinates,
    };
}

export function getConvertGeometryIn(foundation) {
    return value => {
        if (!value || !foundation || value.type !== foundation.featureType) {
            return null;
        }
        if (foundation.featureType === "Point") {
            return { latitude: value.coordinates[1], longitude: value.coordinates[0] };
        }
        return value.coordinates;
    };
}

export function convertStatusIn(value) {
    if (value === "COMPLETED") {
        return "true";
    }
    return null;
}

export function convertStatusOut(dataEntryValue) {
    return dataEntryValue === "true" ? "COMPLETED" : "ACTIVE";
}

export function convertNoteOut(dataEntryValue) {
    return dataEntryValue ? [{ value: dataEntryValue }] : [];
}

export function convertNoteIn(dataEntryValue) {
    if (Array.isArray(dataEntryValue) && dataEntryValue.length > 0) {
        return dataEntryValue[0].value;
    }
    return null;
}
