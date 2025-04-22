import { Async } from "domain/entities/Async";
import { Option } from "domain/entities/Option";

export interface OptionRepository {
    getById(id: string): Async<Option>;
    save(option: Option, options: { dryRun: boolean }): Async<void>;
}
