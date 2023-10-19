import { Async } from "domain/entities/Async";
import { CategoryOptionSpreadsheet } from "domain/entities/CategoryOptionSpreadsheet";

export interface CategoryOptionSpreadsheetRepository {
    saveReport(options: CategoryOptionSpreadsheet): Async<void>;
}
