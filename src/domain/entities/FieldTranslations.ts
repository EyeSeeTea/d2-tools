export interface FieldTranslations<Field extends string> {
    identifier: string;
    field: Field;
    value: string;
    translations: Array<{ locale: LocaleIso839_1; value: string }>;
}

export type LocaleIso839_1 = string;

export type CountryIso3166_1_alpha2 = string;
