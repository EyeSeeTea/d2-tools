import _ from "lodash";
import { D2Api, Id } from "types/d2-api";
import {
    IndicatorsRepository,
    metadataItemName,
    Indicator,
    indicatorDataRow,
    valueReportRow,
} from "domain/repositories/IndicatorsRepository";
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

    async getDataElementsNames(ids: Id[]): Promise<metadataItemName[]> {
        const metadata$ = this.api.metadata.get({
            dataElements: {
                fields: {
                    id: true,
                    name: true,
                },
                filter: { id: { in: ids } },
            },
        });

        const { dataElements } = await metadata$.getData();
        const dataElementsIds = dataElements.map(de => de.id);
        const dataElementsIdsNotFound = _.difference(ids, dataElementsIds);

        if (!_.isEmpty(dataElementsIdsNotFound)) {
            throw new Error(`Data Elements not found: ${dataElementsIdsNotFound.join(", ")}`);
        } else {
            return dataElements;
        }
    }

    async getCOCombosNames(ids: Id[]): Promise<metadataItemName[]> {
        const metadata$ = this.api.metadata.get({
            categoryOptionCombos: {
                fields: {
                    id: true,
                    name: true,
                },
                filter: { id: { in: ids } },
            },
        });

        const { categoryOptionCombos } = await metadata$.getData();
        const categoryOptionCombosIds = categoryOptionCombos.map(de => de.id);
        const categoryOptionCombosIdsNotFound = _.difference(ids, categoryOptionCombosIds);

        if (!_.isEmpty(categoryOptionCombosIdsNotFound)) {
            throw new Error(`Data Elements not found: ${categoryOptionCombosIdsNotFound.join(", ")}`);
        } else {
            return categoryOptionCombos;
        }
    }

    async exportIndicatorsDataToCSV(metadata: indicatorDataRow[], path?: string): Promise<void> {
        const createCsvWriter = CsvWriter.createObjectCsvWriter;
        const csvWriter = createCsvWriter({
            path: path ? path : "indicatorsRefIDs.csv",
            header: indicatorsDataHeaders,
            fieldDelimiter: ";",
        });

        await csvWriter.writeRecords(metadata);
    }

    async exportValuesReportToCSV(data: valueReportRow[], path?: string): Promise<void> {
        const createCsvWriter = CsvWriter.createObjectCsvWriter;
        const csvWriter = createCsvWriter({
            path: path ? path : "indicatorsValuesReport.csv",
            header: valueReportHeaders,
            fieldDelimiter: ";",
        });

        await csvWriter.writeRecords(data);
    }
}

const fields = {
    id: true,
    name: true,
    numerator: true,
    numeratorDescription: true,
    denominator: true,
    denominatorDescription: true,
} as const;

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

const valueReportHeaders = [
    { id: "dataElementId", title: "dataElement ID" },
    { id: "dataElementName", title: "dataElement Name" },
    { id: "coCombosId", title: "categoryOptionCombo ID" },
    { id: "coComboName", title: "categoryOptionCombo Name" },
    { id: "value", title: "Value" },
];
