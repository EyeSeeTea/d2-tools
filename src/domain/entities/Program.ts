import { Maybe } from "utils/ts-utils";
import { Id, NamedRef } from "./Base";

export type ProgramType = "WITH_REGISTRATION" | "WITHOUT_REGISTRATION";

export interface Program {
    id: Id;
    name: string;
    programType: ProgramType;
    programStages: ProgramStage[];
}

type ProgramStage = {
    id: Id;
    programStageDataElements: ProgramStageDataElement[];
};

type ProgramStageDataElement = {
    dataElement: DataElement;
    displayInReports: boolean;
};

type DataElement = {
    id: Id;
    name: string;
    code: string;
    valueType: string;
    optionSet: Maybe<NamedRef>;
};
