import { Async } from "domain/entities/Async";
import * as CsvWriter from "csv-writer";
import log from "utils/log";
import { ReportsRepository } from "./ReportsRepository";
import { Report } from "./Report";

export class ReportsCsvRepository implements ReportsRepository {
    async save<Column extends string>(report: Report<Column>): Async<void> {
        const outputFile = report.name;
        const header = report.columns.map(header => ({ id: header, title: header }));
        const csvWriter = CsvWriter.createObjectCsvWriter({ path: outputFile, header });
        await csvWriter.writeRecords(report.rows);
        log.debug(`Written report ${report.name}: ${outputFile}`);
    }
}
