//
import { parseNumber } from "capture-core-utils/parsers";

export function getNumericFilterData(value) {
    const min = value.min || undefined;
    const max = value.max || undefined;

    return {
        ge: min && parseNumber(min),
        le: max && parseNumber(max),
    };
}
