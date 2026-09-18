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

/* DHIS2 (Java) stores some languages with their legacy ISO 639 code while /api/locales/db
   reports the current one: Indonesian is "in" in translations but "id" in the locales list. */
const legacyLanguageCodes: Record<string, string> = { in: "id", iw: "he", ji: "yi" };

export function normalizeLocaleCode(locale: LocaleCode): LocaleCode {
    const { language, country } = getLocaleInfo(locale);
    const currentLanguage = legacyLanguageCodes[language] ?? language;
    return country ? `${currentLanguage}_${country}` : currentLanguage;
}

/* Locales may be LANGUAGE or LANGUAGE_COUNTRY: compare only the language part, so "en"
   also matches "en_GB". */
export function haveSameLanguage(locale1: LocaleCode, locale2: LocaleCode): boolean {
    const language = (locale: LocaleCode) => getLocaleInfo(normalizeLocaleCode(locale)).language;
    return language(locale1) === language(locale2);
}

export function isSameLocale(locale1: LocaleCode, locale2: LocaleCode): boolean {
    return normalizeLocaleCode(locale1) === normalizeLocaleCode(locale2);
}
