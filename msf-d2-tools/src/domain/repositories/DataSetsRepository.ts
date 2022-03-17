import { CompareResult } from "domain/entities/CompareResult";
import { Id } from "types/d2-api";

export interface DataSetsRepository {
    getSchema(): object;
    compare(id1: Id, id2: Id, options: CompareOptions): Promise<CompareResult>;
}

export interface CompareOptions {
    ignoreProperties?: string[];
}
