import { NamedRef } from "domain/entities/Base";
import { DataSet, DataSetToCompare } from "domain/entities/DataSet";
import { Id } from "types/d2-api";

export interface DataSetsRepository {
    get(): Promise<DataSet[]>;
    //getMetadata:
    getComparableDataSets(ids: Id[]): Promise<Record<Id, DataSetToCompare>>;
    getSchema(): object;
}

export interface DataSetMetadata {
    dataElements: NamedRef;
    categoryOptionCombos: NamedRef[];
}
