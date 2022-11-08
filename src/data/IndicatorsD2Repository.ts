import _ from "lodash";
import { D2Api, Id } from "types/d2-api";
import { Indicator, indicatorDataRow } from "domain/entities/Indicator";
import { IndicatorsRepository } from "domain/repositories/IndicatorsRepository";
import * as CsvWriter from "csv-writer";

export class IndicatorsD2Repository implements IndicatorsRepository {
    constructor(private api: D2Api) {}

    async get(ids: Id[]): Promise<Indicator[]> {
        const metadata$ = this.api.metadata.get({
            indicators: {
                fields,
                filter: { id: { in: ids } },
            },
        });

        const { indicators } = await metadata$.getData();
        const indicatorIds = indicators.map(ind => ind.id);
        const indicatorIdsNotFound = _.difference(ids, indicatorIds);

        if (!_.isEmpty(indicatorIdsNotFound)) {
            throw new Error(`Indicators not found: ${indicatorIdsNotFound.join(", ")}`);
        } else {
            return indicators;
        }
    }

    async exportToCSV(metadata: indicatorDataRow[], path?: string): Promise<void> {
        const createCsvWriter = CsvWriter.createObjectCsvWriter;
        const csvWriter = createCsvWriter({
            path: path ? path : "indicatorsRefIDs.csv",
            header: headers,
            fieldDelimiter: ";",
        });

        await csvWriter.writeRecords(metadata);
    }
}

const fields = {
    id: true,
    name: true,
    numerator: true,
    denominator: true,
} as const;

const headers = [
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
