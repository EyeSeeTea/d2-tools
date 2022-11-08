import { Id } from "./Base";

export interface Indicator {
    id: Id;
    name: string;
    numerator: string;
    denominator: string;
}

export type indicatorDataRow = {
    id: Id;
    indName: string;
    numerator: string;
    numDescription?: string;
    numDataElementsList: string[];
    numProgramDataElementsList: string[];
    numCOCombosList: string[];
    numPIndicatorsList: string[];
    numDataSetsList: string[];
    numProgramList: string[];
    denominator: string;
    denDescription?: string;
    denDataElementsList: string[];
    denProgramDataElementsList: string[];
    denCOCombosList: string[];
    denPIndicatorsList: string[];
    denDataSetsList: string[];
    denProgramList: string[];
};
