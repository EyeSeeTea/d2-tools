import _ from "lodash";
import { LocaleCode } from "./Locale";

export interface Translation<Property extends string = string> {
    property: Property | string; // ex: "NAME", "SHORT_NAME"
    locale: LocaleCode;
    value: string;
}

/* Convert a spreadsheet field name into a DHIS2 translation property. Handles multi-word fields
   (more than one underscore) and both camelCase and spaced inputs.
   Examples: "formName" -> "FORM_NAME", "leftSideDescription" -> "LEFT_SIDE_DESCRIPTION". */
export function translationFieldToProperty(field: string): string {
    return _.snakeCase(field).toUpperCase();
}

export interface ModelTranslations {
    model: string;
    translations: Translation[];
}
