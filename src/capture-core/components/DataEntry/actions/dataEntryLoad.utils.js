//
import { convertValue } from "../../../converters/clientToForm";
import { convertValue as convertListValue } from "../../../converters/clientToList";
import { dataElementTypes, DataElement } from "../../../metaData";

import { getValidationError } from "../dataEntryField/internal/dataEntryField.utils";

export function getDataEntryMeta(dataEntryPropsToInclude) {
    return dataEntryPropsToInclude.reduce((accMeta, propToInclude) => {
        let propMeta;
        if (propToInclude.type) {
            propMeta = { type: propToInclude.type };
        } else if (propToInclude.onConvertOut) {
            propMeta = {
                onConvertOut: propToInclude.onConvertOut.toString(),
                clientId: propToInclude.clientId,
            };
        } else {
            propMeta = {};
        }

        // $FlowFixMe[prop-missing] automated comment
        propMeta.clientIgnore = propToInclude.clientIgnore;

        // $FlowFixMe[prop-missing] automated comment
        accMeta[propToInclude.id || propToInclude.dataEntryId] = propMeta;
        return accMeta;
    }, {});
}

export function getDataEntryValues(dataEntryPropsToInclude, clientValuesForDataEntry) {
    const standardValuesArray = dataEntryPropsToInclude
        // $FlowFixMe[prop-missing] automated comment
        .filter(propToInclude => propToInclude.type)
        // $FlowFixMe[prop-missing] automated comment
        .map(
            propToInclude =>
                new DataElement(o => {
                    o.id = propToInclude.id;
                    o.type = propToInclude.type;
                })
        )
        .map(dataElement => ({
            id: dataElement.id,
            value: dataElement.convertValue(clientValuesForDataEntry[dataElement.id], convertValue),
        }));

    const specialValuesArray = dataEntryPropsToInclude
        // $FlowFixMe[prop-missing] automated comment
        .filter(propToInclude => propToInclude.onConvertIn)
        // $FlowFixMe[prop-missing] automated comment
        .map(propToInclude => ({
            id: propToInclude.dataEntryId,
            value: propToInclude.onConvertIn(clientValuesForDataEntry[propToInclude.clientId]),
        }));

    return [...standardValuesArray, ...specialValuesArray].reduce((accConvertedValues, valueItem) => {
        accConvertedValues[valueItem.id] = valueItem.value;
        return accConvertedValues;
    }, {});
}

export function getDataEntryNotes(clientValuesForDataEntry) {
    const notes = clientValuesForDataEntry.notes || [];
    return notes.map((note, index) => ({
        ...note,
        storedAt: convertListValue(note.storedAt, dataElementTypes.DATETIME),
        key: index,
    }));
}

export function getFormValues(clientValuesForForm, formFoundation) {
    const convertedValues = formFoundation.convertValues(clientValuesForForm, convertValue);
    return convertedValues;
}

export function validateDataEntryValues(values, dataEntryPropsToInclude) {
    return dataEntryPropsToInclude.reduce((accValidations, propToInclude) => {
        // $FlowFixMe[prop-missing] automated comment
        const id = propToInclude.dataEntryId || propToInclude.id;
        const value = values[id];
        const validatorContainers = propToInclude.validatorContainers;
        const validationError = getValidationError(value, validatorContainers);

        accValidations[id] = {
            isValid: !validationError,
            validationError,
        };

        return accValidations;
    }, {});
}
