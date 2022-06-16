import { DataSet, DataSetDataElement, DataSetToCompare } from "domain/entities/DataSet";
import { Id } from "types/d2-api";

export interface DataSetsRepository {
    get(): Promise<DataSet[]>;
    getComparableDataSets(ids: Id[]): Promise<Record<Id, DataSetToCompare>>;
    getSchema(): object;
}
