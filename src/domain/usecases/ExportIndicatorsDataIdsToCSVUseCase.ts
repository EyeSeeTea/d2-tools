import { indicatorDataReportRow } from "domain/entities/IndicatorsReports";
import * as CsvWriter from "csv-writer";

export class exportIndicatorsDataIdsToCSVUseCase {
    async execute(metadata: indicatorDataReportRow[], path?: string): Promise<void> {
        exportIndicatorsDataToCSV(metadata, path);
    }
}

const indicatorsDataHeaders = [
    { id: "id", title: "UID" },
    { id: "indName", title: "Indicator" },
    { id: "numerator", title: "Numerator" },
    { id: "numDescription", title: "Numerator Description" },
    { id: "numDataElementsList", title: "List of referenced dataElements" },
    { id: "numProgramDataElementsList", title: "List of referenced programDataElements" },
    { id: "numCOCombosList", title: "List of referenced categoryOptionCombos" },
    { id: "numPIndicatorsList", title: "List of referenced Indicators" },
    { id: "numDataSetsList", title: "List of referenced dataSets" },
    { id: "numProgramList", title: "List of referenced programs" },
    { id: "denominator", title: "Denominator" },
    { id: "denDescription", title: "Denominator Description" },
    { id: "denDataElementsList", title: "List of referenced dataElements" },
    { id: "denProgramDataElementsList", title: "List of referenced programDataElements" },
    { id: "denCOCombosList", title: "List of referenced categoryOptionCombos" },
    { id: "denPIndicatorsList", title: "List of referenced Indicators" },
    { id: "denDataSetsList", title: "List of referenced dataSets" },
    { id: "denProgramList", title: "List of referenced programs" },
];

async function exportIndicatorsDataToCSV(metadata: indicatorDataReportRow[], path?: string): Promise<void> {
    const createCsvWriter = CsvWriter.createObjectCsvWriter;
    const csvWriter = createCsvWriter({
        path: path ? path : "indicatorsRefIDs.csv",
        header: indicatorsDataHeaders,
        fieldDelimiter: ";",
    });

    await csvWriter.writeRecords(metadata);
}
