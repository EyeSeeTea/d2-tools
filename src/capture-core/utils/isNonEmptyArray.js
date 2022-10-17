//
import isArray from "d2-utilizr/src/isArray";

export function isNonEmptyArray(toCheck) {
    return !!toCheck && isArray(toCheck) && toCheck.length > 0;
}
