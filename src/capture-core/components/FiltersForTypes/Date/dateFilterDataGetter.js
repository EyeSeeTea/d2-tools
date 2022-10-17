//
import { parseNumber } from "capture-core-utils/parsers";
import { mainOptionKeys } from "./options";
import { dateFilterTypes } from "./constants";
import { parseDate } from "../../../utils/converters/date";
import {} from "./types";

function convertAbsoluteDate(fromValue, toValue) {
    const rangeData = {
        type: dateFilterTypes.ABSOLUTE,
    };

    if (fromValue) {
        // $FlowFixMe[incompatible-type] automated comment
        const fromClientValue = parseDate(fromValue).momentDate;
        rangeData.ge = fromClientValue;
    }

    if (toValue) {
        // $FlowFixMe[incompatible-type] automated comment
        const toClientValue = parseDate(toValue).momentDate;
        rangeData.le = toClientValue;
    }

    return rangeData;
}

function convertRelativeRange(value) {
    const rangeData = {
        type: dateFilterTypes.RELATIVE,
    };
    const startBuffer = value.start && parseNumber(value.start);
    const endBuffer = value.end && parseNumber(value.end);

    if (startBuffer || startBuffer === 0) {
        rangeData.startBuffer = -Math.abs(startBuffer);
    }

    if (endBuffer || endBuffer === 0) {
        rangeData.endBuffer = endBuffer;
    }

    return rangeData;
}

function convertSelections(value) {
    if (value.main === mainOptionKeys.ABSOLUTE_RANGE) {
        return convertAbsoluteDate(value.from, value.to);
    }
    if (value.main === mainOptionKeys.RELATIVE_RANGE) {
        return convertRelativeRange(value);
    }
    return { type: dateFilterTypes.RELATIVE, period: value.main };
}

export function getDateFilterData(value) {
    return convertSelections(value);
}
