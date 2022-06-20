import { Async } from "domain/entities/Async";
import {
    CountryCodeIso3166_1_alpha2,
    FieldTranslations,
    LanguageCodeIso839_1,
} from "domain/entities/FieldTranslations";

export interface FieldTranslationsRepository {
    get<Field extends string>(options: GetFieldTranslationsOptions<Field>): Async<FieldTranslations<Field>[]>;
}

export interface GetFieldTranslationsOptions<Field extends string> {
    translatableField: Field;
    inputFile: string;
    skipHeaders: string[];
    countryMapping: Record<LanguageCodeIso839_1, CountryCodeIso3166_1_alpha2>;
}
