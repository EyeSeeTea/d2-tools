//
import { dataElementTypes } from "../metaData";
import { convertValue as convertToServerValue } from "../converters/clientToServer";
import { convertValue as convertToClientValue } from "../converters/serverToClient";

function getConvertedValue(valueToConvert, key, onConvertValue, compareKeys) {
    let convertedValue;
    if (key === compareKeys.enrolledAt || key === compareKeys.occurredAt) {
        convertedValue = onConvertValue(valueToConvert, dataElementTypes.DATE);
    } else {
        convertedValue = valueToConvert;
    }
    return convertedValue;
}

export function convertEnrollment(enrollment, onConvertValue, keyMap = {}, compareKeysMapFromDefault = {}) {
    const calculatedCompareKeys = {
        enrolledAt: compareKeysMapFromDefault.enrolledAt || "enrolledAt",
        occurredAt: compareKeysMapFromDefault.occurredAt || "occurredAt",
    };

    return Object.keys(enrollment).reduce((accConvertedEnrollment, key) => {
        const convertedValue = getConvertedValue(enrollment[key], key, onConvertValue, calculatedCompareKeys);
        const outputKey = keyMap[key] || key;
        accConvertedEnrollment[outputKey] = convertedValue;
        return accConvertedEnrollment;
    }, {});
}

const mapEnrollmentClientKeyToServerKey = {
    enrollmentId: "enrollment",
    programId: "program",
    programStageId: "programStage",
    orgUnitId: "orgUnit",
};

export function convertEnrollmentClientToServerWithKeysMap(enrollment) {
    return convertEnrollment(enrollment, convertToServerValue, mapEnrollmentClientKeyToServerKey);
}

const mapEnrollmentServerKeyToClientKey = {
    enrollment: "enrollmentId",
    program: "programId",
    programStage: "programStageId",
    orgUnit: "orgUnitId",
};

export function convertEnrollmentServerToClientWithKeysMap(enrollment) {
    return convertEnrollment(enrollment, convertToClientValue, mapEnrollmentServerKeyToClientKey);
}
