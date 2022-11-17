//
/**
 *
 * @export
 * @param {string} value
 * @returns
 */
export const isValidPositiveInteger = value => {
    if (isNaN(value)) {
        return false;
    }

    const number = Number(value);
    return Number.isSafeInteger(number) && number > 0;
};
