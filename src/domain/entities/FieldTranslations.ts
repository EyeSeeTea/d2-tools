import { TranslatableField, Translation } from "./Translation";

export type FieldTranslations = FieldTranslation[];

export interface FieldTranslation {
    model: string; // plural
    identifier: Partial<{ id: string; name: string; code: string }>;
    translations: Translation[];
    /* Values to write on the object itself, not as a translation. Filled from the columns whose
       locale is the default locale (see option --default-locale). */
    fields: FieldValues;
}

export type FieldValues = Partial<Record<TranslatableField, string>>;
