import { Id } from "domain/entities/Base";

export interface Program {
    program: string;
    programStages: ProgramStage[];
    organisationUnits: Id[];
}

export interface ProgramStage {
    id: string;
    programStageDataElements: ProgramStageDataElement[];
}

export interface ProgramStageDataElement {
    name: string;
    code: string;
    dataElement: DataElement;
}

export interface ProgramMetadata {
    id: string;
    programStageId: string;
    dataElements: DataElement[];
    orgUnitId: string;
}

export interface EventDataValue {
    dataElement: Id;
    value: string | number;
}

export interface DataElement {
    id: string;
    code: string;
    name: string;
}
