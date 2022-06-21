import { Async } from "domain/entities/Async";
import { FieldTranslations } from "domain/entities/FieldTranslations";

export interface FieldTranslationsRepository {
    get<Field extends string>(options: GetFieldTranslationsOptions<Field>): Async<FieldTranslations<Field>[]>;
}

export interface GetFieldTranslationsOptions<Field extends string> {
    translatableField: Field;
    inputFile: string;
    skipHeaders: string[];
    locales: string[];
}