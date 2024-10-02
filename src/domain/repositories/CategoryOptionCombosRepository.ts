import { Id, NamedRef } from "domain/entities/Base";

export interface CategoryOptionCombosRepository {
    getCOCombosNames(ids: Id[]): Promise<NamedRef[]>;
}
