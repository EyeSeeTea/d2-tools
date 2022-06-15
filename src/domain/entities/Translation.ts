import { CountryIso3166_1_alpha2, LocaleIso839_1 } from "./FieldTranslations";

export interface Translation<Property extends string = string> {
    property: Property;
    locale: string;
    value: string;
}

export function getLocaleInfo(locale: string): {
    language: LocaleIso839_1;
    country?: CountryIso3166_1_alpha2;
} {
    const [language = "", country] = locale.split("_", 2);
    return { language, country };
}

export function getLocaleLanguage(locale: string): LocaleIso839_1 {
    return getLocaleInfo(locale).language;
}
