import { UserMonitoringDataElement } from "./UserMonitoringDataElement";

export interface UserMonitoringProgramMetadata {
    id: string;
    programStageId: string;
    dataElements: UserMonitoringDataElement[];
    orgUnitId: string;
}
