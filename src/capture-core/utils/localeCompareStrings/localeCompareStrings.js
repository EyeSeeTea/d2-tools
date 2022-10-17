//
import i18n from "@dhis2/d2-i18n";

export const localeCompareStrings = (a, b) => a.localeCompare(b, i18n.language);
