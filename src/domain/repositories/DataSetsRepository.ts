import { DataSet, DataSetMetadata } from "domain/entities/DataSet";
import { Id } from "types/d2-api";

export interface DataSetsRepository {
    get(ids: Id[]): Promise<Record<Id, DataSet>>;
    post(data: DataSetMetadata): Promise<OUCopyResult>;
    getSchema(): object;
}

export type OUCopyResult = "OK" | "ERROR" | "NO_CHANGE";
