import { DateTime } from "luxon";

export type DateTimeIso8601 = string;

/* Compare two ISO 8801 datetimes.

  Strings with be truncated to the shortest length, so you can compare incomplete datetimes.
*/
export function compareDateTimeIso8601(date1: DateTimeIso8601, date2: DateTimeIso8601): "LT" | "EQ" | "GT" {
    const minLength = Math.min(date1.length, date2.length);
    const date1m = date1.slice(0, minLength);
    const date2m = date2.slice(0, minLength);

    if (date1m < date2m) {
        return "LT";
    } else if (date1m > date2m) {
        return "GT";
    } else {
        return "EQ";
    }
}

/* Get the number of complete months between two ISO dates.
   Uses day-level precision: a month is only counted when the day of the later date
   is >= the day of the earlier date. For example, 2026-03-31 to 2026-04-01 = 0 months.
*/
export function getMonthsDiff(startDate: string, endDate: string): number {
    const start = DateTime.fromISO(startDate);
    const end = DateTime.fromISO(endDate);
    const diff = end.diff(start, "months").months;
    return Math.floor(diff);
}
