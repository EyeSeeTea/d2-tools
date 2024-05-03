import { indicatorDEValueReportRow } from "domain/entities/IndicatorsReports";
import * as CsvWriter from "csv-writer";

export class exportValuesReportToCSVUseCase {
    async execute(metadata: indicatorDEValueReportRow[], path?: string): Promise<void> {
        exportValuesReportToCSV(metadata, path);
    }
}

const valueReportHeaders = [
    { id: "dataElementId", title: "dataElement ID" },
    { id: "dataElementName", title: "dataElement Name" },
    { id: "coCombosId", title: "categoryOptionCombo ID" },
    { id: "coComboName", title: "categoryOptionCombo Name" },
    { id: "value", title: "Value" },
];

async function exportValuesReportToCSV(data: indicatorDEValueReportRow[], path?: string): Promise<void> {
    const createCsvWriter = CsvWriter.createObjectCsvWriter;
    const csvWriter = createCsvWriter({
        path: path ? path : "indicatorsValuesReport.csv",
        header: valueReportHeaders,
        fieldDelimiter: ";",
    });

    await csvWriter.writeRecords(data);
}
