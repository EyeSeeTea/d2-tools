//
import log from "loglevel";
import isArray from "d2-utilizr/lib/isArray";
import isObject from "d2-utilizr/lib/isObject";
import { errorCreator } from "capture-core-utils";

const errorMessages = {
    CONVERT_VALUES_STRUCTURE: "Values can not be converted, data is neither an array or an object",
};

function getElementsById(dataElements) {
    // $FlowFixMe
    return dataElements.toHashMap("id");
}

function convertObjectValues(values, elementsById, onConvert) {
    return Object.keys(values).reduce((inProgressValues, id) => {
        const metaElement = elementsById[id];
        const rawValue = values[id];
        const convertedValue = metaElement ? metaElement.convertValue(rawValue, onConvert) : rawValue;
        return { ...inProgressValues, [id]: convertedValue };
    }, {});
}

function convertArrayValues(arrayOfValues, elementsById, onConvert) {
    // $FlowFixMe[prop-missing] automated comment
    return arrayOfValues.map(values => this.convertObjectValues(values, elementsById, onConvert));
}

export function convertValues(values, dataElements, onConvert) {
    if (values) {
        const elementsById = getElementsById(dataElements);
        if (isArray(values)) {
            // $FlowFixMe[incompatible-return] automated comment
            // $FlowFixMe[incompatible-call] automated comment
            return convertArrayValues(values, elementsById, onConvert);
        } else if (isObject(values)) {
            // $FlowFixMe[incompatible-return] automated comment
            // $FlowFixMe[incompatible-call] automated comment
            return convertObjectValues(values, elementsById, onConvert);
        }

        log.error(errorCreator(errorMessages.CONVERT_VALUES_STRUCTURE)({ values }));
    }
    return values;
}
