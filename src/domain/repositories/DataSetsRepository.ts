import { Id, Identifiable, Ref } from "domain/entities/Base";
import { DataSet, DataSetMetadata, DataSetToCompare } from "domain/entities/DataSet";

export interface DataSetsRepository {
    get(ids: Id[]): Promise<Record<Id, DataSet>>;
    getAll(): Promise<DataSet[]>;
    post(data: DataSetMetadata): Promise<OUCopyResult>;
    getComparableDataSets(ids: Id[]): Promise<Record<Id, DataSetToCompare>>;
    getSchema(): object;
    getByIdentifiables(values: Identifiable[]): Promise<DataSet[]>;
    getDataSetByElementId(dataSetElements: Id[]): Promise<Ref[]>;
}

export type OUCopyResult = "OK" | "ERROR" | "NO_CHANGE";
