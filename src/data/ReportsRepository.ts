import { Async } from "domain/entities/Async";
import { Path } from "domain/entities/Base";
import { Report } from "domain/entities/Report";

export interface ReportsRepository {
    save(report: Report<string>, outputFile: Path): Async<void>;
}
