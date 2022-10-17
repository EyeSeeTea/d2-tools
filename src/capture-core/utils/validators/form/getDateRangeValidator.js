//
import { isValidDate } from "./dateValidator";
import { parseDate } from "../../converters/date";
/**
 *
 * @export
 * @param {string} value
 * @returns
 */

function isValidDateWithEmptyCheck(value) {
    return value && isValidDate(value);
}

export const getDateRangeValidator = invalidDateMessage => value => {
    const errorResult = [];
    if (!isValidDateWithEmptyCheck(value.from)) {
        errorResult.push({ from: invalidDateMessage });
    }

    if (!isValidDateWithEmptyCheck(value.to)) {
        errorResult.push({ to: invalidDateMessage });
    }

    if (errorResult.length > 0) {
        return {
            valid: false,
            // $FlowFixMe[exponential-spread] automated comment
            errorMessage: errorResult.reduce((map, error) => ({ ...map, ...error }), {}),
        };
    }
    // $FlowFixMe
    return parseDate(value.from).momentDate <= parseDate(value.to).momentDate;
};
