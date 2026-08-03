import { Async } from "domain/entities/Async";
import { FieldTranslations } from "domain/entities/FieldTranslations";
import { Locale, LocaleCode } from "domain/entities/Locale";

export interface ImportTranslationsRepository {
    get(options: GetFieldTranslationsOptions): Async<FieldTranslations>;
}

export interface GetFieldTranslationsOptions {
    inputFile: string;
    locales: Locale[];
    /* Columns of this locale are also written to the object field itself, not only as a
       translation. Matched by language, so "en" also matches a column mapped to "en_GB". */
    defaultLocale?: LocaleCode;
}
