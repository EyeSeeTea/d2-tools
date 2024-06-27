import { Id } from "types/d2-api";

export interface UserMonitoringD2Program {
    program: string;
    programStages: UserMonitoringD2ProgramStage[];
    organisationUnits: Id[];
}

export interface UserMonitoringD2ProgramStage {
    id: string;
    programStageDataElements: UserMonitoringD2ProgramStageDataElement[];
}

export interface UserMonitoringD2ProgramStageDataElement {
    name: string;
    code: string;
    dataElement: UserMonitoringD2DataElement;
}
export interface UserMonitoringD2DataElement {
    id: string;
    code: string;
    name: string;
}
