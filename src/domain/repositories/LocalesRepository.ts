import { Async } from "domain/entities/Async";
import { Locale } from "domain/entities/Locale";

export interface LocalesRepository {
    get(): Async<Locale[]>;
}
