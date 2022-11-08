import { DataSet, DataSetId, DataSetMetadata, DataSetToCompare } from "domain/entities/DataSet";
import { Id } from "types/d2-api";

export interface DataSetsRepository {
    get(ids: Id[]): Promise<Record<Id, DataSet>>;
    getAll(): Promise<DataSet[]>;
    post(data: DataSetMetadata): Promise<OUCopyResult>;
    getComparableDataSets(ids: Id[]): Promise<Record<Id, DataSetToCompare>>;
    getSchema(): object;
    getDataSetByElementId(dataSetElements: Id[]): Promise<DataSetId[]>;
}

export type OUCopyResult = "OK" | "ERROR" | "NO_CHANGE";
