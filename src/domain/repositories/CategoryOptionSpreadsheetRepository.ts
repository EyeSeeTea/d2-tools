import { Async } from "domain/entities/Async";
import { Path } from "domain/entities/Base";
import { CategoryOption } from "domain/entities/CategoryOption";

export interface CategoryOptionSpreadsheetRepository {
    saveReport(categoryOptions: CategoryOption[], reportPath: Path): Async<void>;
}
