import { CompareResult } from "domain/entities/CompareResult";
import { Id } from "types/d2-api";

export interface DataSetsRepository {
    compare(id1: Id, id2: Id): Promise<CompareResult>;
}
