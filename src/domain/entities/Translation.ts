import { CountryCodeIso3166_1_alpha2, LanguageCodeIso839_1 } from "./FieldTranslations";

export interface Translation<Property extends string = string> {
    property: Property;
    locale: string;
    value: string;
}

export function getLocaleInfo(locale: string): {
    language: LanguageCodeIso839_1;
    country?: CountryCodeIso3166_1_alpha2;
} {
    const [language = "", country] = locale.split("_", 2);
    return { language, country };
}

export function getLocaleLanguage(locale: string): LanguageCodeIso839_1 {
    return getLocaleInfo(locale).language;
}
