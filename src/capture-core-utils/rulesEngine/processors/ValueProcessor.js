//
import log from "loglevel";
import isString from "d2-utilizr/lib/isString";
// TODO: add some kind of errorcreator to d2 before moving
import { errorCreator } from "capture-core-utils/errorCreator";
import { mapTypeToInterfaceFnName } from "../constants";
import { trimQuotes } from "../commonUtils/trimQuotes";

export class ValueProcessor {
    static errorMessages = {
        CONVERTER_NOT_FOUND: "converter for type is missing",
    };

    static addQuotesToValueIfString(value) {
        return isString(value) ? `'${value}'` : value;
    }

    constructor(converterObject) {
        this.converterObject = converterObject;
        this.processValue = this.processValue.bind(this);
    }

    processValue(value, type) {
        if (isString(value)) {
            value = trimQuotes(value);
        }

        // $FlowFixMe[prop-missing] automated comment
        const convertFnName = mapTypeToInterfaceFnName[type];
        if (!convertFnName) {
            log.warn(errorCreator(ValueProcessor.errorMessages.CONVERTER_NOT_FOUND)({ type }));
            return value;
        }

        // $FlowFixMe[incompatible-use] automated comment
        const convertedValue = ValueProcessor.addQuotesToValueIfString(
            this.converterObject[convertFnName](value)
        );
        return convertedValue;
    }
}
