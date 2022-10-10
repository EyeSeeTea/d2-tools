import { DataSet } from "domain/entities/DataSet";
import { Id, MetadataResponse } from "types/d2-api";

export interface DataSetsRepository {
    get(ids: Id[]): Promise<Record<Id, DataSet>>;
    post(data: object, options: object): Promise<MetadataResponse>;
    getSchema(): object;
}
