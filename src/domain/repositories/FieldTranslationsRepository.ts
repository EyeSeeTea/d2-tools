import { Async } from "domain/entities/Async";
import {
    CountryIso3166_1_alpha2,
    FieldTranslations,
    LocaleIso839_1,
} from "domain/entities/FieldTranslations";

export interface FieldTranslationsRepository {
    get<Field extends string>(options: GetFieldTranslationsOptions<Field>): Async<FieldTranslations<Field>[]>;
}

export interface GetFieldTranslationsOptions<Field extends string> {
    translatableField: Field;
    inputFile: string;
    skipHeaders: string[];
    countryMapping: Record<LocaleIso839_1, CountryIso3166_1_alpha2>;
}
