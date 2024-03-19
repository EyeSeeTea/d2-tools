import { Id } from "domain/entities/Base";

export interface IndicatorsRepository {
    get(ids: Id[]): Promise<Indicator[]>;
    getDataElementsNames(ids: Id[]): Promise<metadataItemName[]>;
    getCOCombosNames(ids: Id[]): Promise<metadataItemName[]>;
    exportIndicatorsDataToCSV(metadata: indicatorDataRow[], path?: string): Promise<void>;
    exportValuesReportToCSV(metadata: valueReportRow[], path?: string): Promise<void>;
}

export interface Indicator {
    id: Id;
    name: string;
    numerator: string;
    numeratorDescription: string;
    denominator: string;
    denominatorDescription: string;
}

export interface metadataItemName {
    id: string;
    name: string;
}

export type indicatorDataRow = {
    id: Id;
    indName: string;
    numerator: string;
    numDescription: string;
    numDataElementsList: string[];
    numProgramDataElementsList: string[];
    numCOCombosList: string[];
    numPIndicatorsList: string[];
    numDataSetsList: string[];
    numProgramList: string[];
    denominator: string;
    denDescription: string;
    denDataElementsList: string[];
    denProgramDataElementsList: string[];
    denCOCombosList: string[];
    denPIndicatorsList: string[];
    denDataSetsList: string[];
    denProgramList: string[];
};

export type valueReportRow = {
    dataElementId: string;
    dataElementName: string;
    coCombosId?: string;
    coCombosName?: string;
    value: string;
};
