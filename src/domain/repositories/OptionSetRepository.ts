import { Async } from "domain/entities/Async";
import { OptionSet } from "domain/entities/OptionSet";

export interface OptionSetRepository {
    getAll(): Async<OptionSet[]>;
}
