import { Id, NamedRef } from "domain/entities/Base";

export interface DataElementsRepository {
    getDataElementsNames(ids: Id[]): Promise<NamedRef[]>;
}
