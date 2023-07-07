//
import { isValidDateTime as isValidDateTimeCore } from "capture-core-utils/validators/form";
import { systemSettingsStore } from "../../../metaDataMemoryStores";

export function isValidDateTime(value) {
    const dateFormat = systemSettingsStore.get().dateFormat;
    return isValidDateTimeCore(value, dateFormat);
}
