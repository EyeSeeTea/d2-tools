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
