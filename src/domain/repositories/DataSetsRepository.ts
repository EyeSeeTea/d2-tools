import { DataSet } from "domain/entities/DataSet";
import { Id } from "types/d2-api";

export interface DataSetsRepository {
    get(ids: Id[]): Promise<Record<Id, DataSet>>;
    getSchema(): object;
}
