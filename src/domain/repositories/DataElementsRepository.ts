import { Id, NamedRef } from "domain/entities/Base";
import { DataElement } from "domain/entities/DataElement";

export interface DataElementsRepository {
    getByIds(ids: Id[]): Promise<DataElement[]>;
    getDataElementsNames(ids: Id[]): Promise<NamedRef[]>;
}
