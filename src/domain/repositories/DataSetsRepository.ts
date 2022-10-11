import { DataSet } from "domain/entities/DataSet";
import { DataSetMetadata } from "domain/entities/DataSetMetadata";
import { OUCopyResult } from "domain/entities/OUCopyResult";
import { Id } from "types/d2-api";

export interface DataSetsRepository {
    get(ids: Id[]): Promise<Record<Id, DataSet>>;
    post(data: DataSetMetadata): Promise<OUCopyResult>;
    getSchema(): object;
}
