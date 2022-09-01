//
import { parseDate } from "../../parsers";
/**
 *
 * @export
 * @param {string} value
 * @returns
 */
export function isValidDate(value, format) {
    const parseData = parseDate(value, format);
    return parseData.isValid;
}
