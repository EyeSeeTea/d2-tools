import { Id } from "./Base";

export interface Locale {
    id: Id;
    name: string;
    locale: LocaleCode;
}

export type LocaleCode = string; // Valid values: "en" or "en_US"
export type LanguageCodeIso839_1 = string;
export type CountryCodeIso3166_1_alpha2 = string;

export function getLocaleInfo(locale: string): {
    language: LanguageCodeIso839_1;
    country?: CountryCodeIso3166_1_alpha2;
} {
    const [language = "", country] = locale.split("_", 2);
    return { language, country };
}
