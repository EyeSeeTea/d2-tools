export interface FieldTranslations<Field extends string> {
    identifier: string;
    field: Field;
    value: string;
    translations: Array<{ locale: LocaleCode; value: string }>;
}

export type LocaleCode = string; // Valid values: "en" or "en_US"
export type LanguageCodeIso839_1 = string;
export type CountryCodeIso3166_1_alpha2 = string;
