import { TranslatableField, Translation } from "./Translation";

export type FieldTranslations = FieldTranslation[];

export interface FieldTranslation {
    model: string; // plural
    identifier: Partial<{ id: string; name: string; code: string }>;
    translations: Translation[];
    /* Values to write on the object itself, not as a translation. Filled from the bare field
       columns (no locale) and from the columns of the default locale (option --default-locale). */
    fields: FieldValues;
}

export type FieldValues = Partial<Record<TranslatableField, string>>;
