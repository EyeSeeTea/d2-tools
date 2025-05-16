import { LocaleCode } from "./Locale";

export interface Translation<Property extends string = string> {
    property: Property | string; // ex: "NAME", "SHORT_NAME"
    locale: LocaleCode;
    value: string;
}

export interface ModelTranslations {
    model: string;
    translations: Translation[];
}
