//
import { parseTime } from "../../parsers";

/**
 *
 * @export
 * @param {string} value
 * @returns
 */
export function isValidTime(value) {
    const momentTime = parseTime(value);
    return momentTime.isValid;
}
