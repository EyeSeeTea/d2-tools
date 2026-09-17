import { Async } from "domain/entities/Async";
import { FieldTranslations } from "domain/entities/FieldTranslations";
import { Locale, LocaleCode } from "domain/entities/Locale";
import { MetadataModel } from "domain/entities/MetadataObject";
import { TranslatableField } from "domain/entities/Translation";

export interface ImportTranslationsRepository {
    get(options: GetFieldTranslationsOptions): Async<FieldTranslations>;
}

export interface GetFieldTranslationsOptions {
    inputFile: string;
    locales: Locale[];
    /* Columns of this locale are also written to the object field itself, not only as a
       translation. Matched by language, so "en" also matches a column mapped to "en_GB". */
    defaultLocale?: LocaleCode;
    /* Translatable fields of each model (plural). A bare column (no locale) named as one of them
       writes the field itself. */
    translatableFields: Record<MetadataModel, TranslatableField[]>;
}
