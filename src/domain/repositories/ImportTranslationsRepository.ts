import { Async } from "domain/entities/Async";
import { FieldTranslations } from "domain/entities/FieldTranslations";
import { Locale } from "domain/entities/Locale";

export interface ImportTranslationsRepository {
    get(options: GetFieldTranslationsOptions): Async<FieldTranslations>;
}

export interface GetFieldTranslationsOptions {
    inputFile: string;
    locales: Locale[];
}
