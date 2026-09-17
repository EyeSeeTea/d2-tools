import _ from "lodash";
import { LocaleCode } from "./Locale";

export interface Translation<Property extends string = string> {
    property: Property | string; // ex: "NAME", "SHORT_NAME"
    locale: LocaleCode;
    value: string;
}

/* A translatable field of a metadata object, as written in a spreadsheet column. The listed values
   are the common ones (autocompleted by the editor); the set is open because translatable fields
   vary per model (ex: executionDateLabel on programs, leftSideDescription on validation rules). */
export type TranslatableField =
    | "name"
    | "shortName"
    | "formName"
    | "description"
    | "leftSideDescription"
    | "rightSideDescription"
    | "executionDateLabel"
    | (string & {});

/* Translatable fields whose value must be unique in the instance: writing them from a spreadsheet
   may make the whole metadata payload fail to validate. */
export const uniqueTranslatableFields: TranslatableField[] = ["name", "shortName"];

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
