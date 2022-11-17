//
import { isValidDate } from "./date.validator";
import { isValidTime } from "./time.validator";

export function isValidDateTime(value, dateFormat) {
    if (!value) return false;
    const date = value.date;
    const time = value.time;

    if (!date || !time) {
        return false;
    }

    return isValidDate(date, dateFormat) && isValidTime(time);
}
