import { Id } from "domain/entities/Base";

export type indicatorDataReportRow = {
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

export type indicatorDEValueReportRow = {
    dataElementId: string;
    dataElementName: string;
    coCombosId?: string;
    coCombosName?: string;
    value: string;
};
