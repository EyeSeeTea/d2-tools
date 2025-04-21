import { Id, Identifiable, Ref } from "domain/entities/Base";
import { DataSet, DataSetMetadata, DataSetToCompare } from "domain/entities/DataSet";

export interface DataSetsRepository {
    get(ids: Id[]): Promise<Record<Id, DataSet>>;
    getAll(): Promise<DataSet[]>;
    post(data: DataSetMetadata, saveOptions?: Partial<SaveOptions>): Promise<DataSetPostResult>;
    getComparableDataSets(ids: Id[]): Promise<Record<Id, DataSetToCompare>>;
    getSchema(): object;
    getByIdentifiables(values: Identifiable[]): Promise<DataSet[]>;
    getByDataElements(dataSetElements: Id[]): Promise<Ref[]>;
}

export type DataSetPostResult = "OK" | "ERROR" | "NO_CHANGE";

export type SaveOptions = {
    skipPermissions: boolean;
};
