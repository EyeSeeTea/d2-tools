import { Maybe } from "utils/ts-utils";
import { Id } from "./Base";
import { isSameLocale, LocaleCode } from "./Locale";
import { Translation, translationFieldToProperty } from "./Translation";

export type MetadataModel = string; // Ex: "dataElements".

export interface MetadataObject {
    model: MetadataModel;
    id: Id;
    name: string;
    code: Maybe<string>;
}

export interface MetadataObjectWithTranslations extends MetadataObject {
    translations: Translation[];
}

/* Objects are fetched with `:owner` (or read from a metadata export), so they carry all owner
   fields at runtime even though the type only declares id/name/code/translations. */
export function getMetadataObjectField(object: MetadataObject, field: string): string {
    const value = (object as unknown as Record<string, unknown>)[field];
    return typeof value === "string" ? value : "";
}

/* Translation of a translatable field (e.g. "formName" -> property FORM_NAME) in a locale. */
export function getMetadataObjectTranslation(
    object: MetadataObjectWithTranslations,
    field: string,
    locale: LocaleCode
): Maybe<string> {
    const property = translationFieldToProperty(field);
    const translation = object.translations.find(
        t => t.property === property && isSameLocale(t.locale, locale)
    );
    return translation?.value;
}
