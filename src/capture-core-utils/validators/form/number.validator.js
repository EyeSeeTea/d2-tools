//
/**
 *
 * @export
 * @param {string} value
 * @returns
 */
export const isValidNumber = value => !!(!isNaN(value) && Number(value) !== Infinity);
