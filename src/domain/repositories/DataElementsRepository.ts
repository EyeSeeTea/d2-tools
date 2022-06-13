import { Async } from "domain/entities/Async";
import { DataElement } from "domain/entities/DataElement";

export interface DataElementsRepository {
    get(): Async<DataElement[]>;
    save(dataElements: DataElement[]): Async<void>;
}
