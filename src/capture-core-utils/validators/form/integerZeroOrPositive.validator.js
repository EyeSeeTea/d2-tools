//
import { isValidPositiveInteger } from "./integerPositive.validator";

/**
 *
 * @export
 * @param {string} value
 * @returns
 */
export const isValidZeroOrPositiveInteger = value => {
    if (value === "0") {
        return true;
    }
    return isValidPositiveInteger(value);
};
