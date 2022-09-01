//

/**
 *
 * @export
 * @param {string} value
 * @returns
 */

export const isValidOrgUnit = value => {
    const valid = !!(value && value.id && value.name);
    return valid;
};
