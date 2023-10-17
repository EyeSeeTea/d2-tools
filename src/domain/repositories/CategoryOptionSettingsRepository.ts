import { Async } from "domain/entities/Async";
import { Path } from "domain/entities/Base";
import { CategoryOptionSettings } from "domain/entities/CategoryOptionSettings";

export interface CategoryOptionSettingsRepository {
    get(path: Path): Async<CategoryOptionSettings>;
}
