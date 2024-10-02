/**
 * Formats a given date into a DHIS2 log timestamp.
 *
 * @param date - The date to be formatted.
 * @returns The timestamp as a string.
 */

export function getLogFormatDate(date: Date): string {
    const isoString = date.toISOString();

    return isoString.replace("Z", "").replace(".", ",");
}
