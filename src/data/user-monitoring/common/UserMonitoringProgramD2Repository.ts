import log from "utils/log";
import { D2Api } from "types/d2-api";
import { UserMonitoringProgramMetadata } from "domain/entities/user-monitoring/common/UserMonitoringProgramMetadata";
import { UserMonitoringProgramRepository } from "domain/repositories/user-monitoring/common/UserMonitoringProgramRepository";
import {
    UserMonitoringD2DataElement,
    UserMonitoringD2Program,
    UserMonitoringD2ProgramStage,
    UserMonitoringD2ProgramStageDataElement,
} from "../entities/UserMonitoringD2Program";
import { Async } from "domain/entities/Async";

export class UserMonitoringProgramD2Repository implements UserMonitoringProgramRepository {
    constructor(private api: D2Api) {}

    async get(programId: string): Async<UserMonitoringProgramMetadata> {
        const responseProgram = await this.getProgram(this.api, programId);

        const programs = responseProgram[0] ?? undefined;

        if (programs === undefined) {
            log.error(`Program ${programId} not found`);
            throw new Error(`Program ${programId} not found`);
        }

        const programStage: UserMonitoringD2ProgramStage | undefined = programs.programStages[0];

        const orgunitstring = JSON.stringify(programs.organisationUnits[0]);
        const orgUnit: { id: string } = JSON.parse(orgunitstring);
        const orgUnitId: string = orgUnit.id;

        if (programStage === undefined) {
            throw new Error(`ProgramStage in ${programId} not found`);
        }

        if (orgUnitId === undefined) {
            throw new Error(`Program OrgUnit in ${programId} not found`);
        }

        const programStageDataElements: UserMonitoringD2ProgramStageDataElement[] =
            programStage.programStageDataElements;

        const dataElements: UserMonitoringD2DataElement[] = programStageDataElements.map(item => {
            return item.dataElement;
        });

        const program: UserMonitoringProgramMetadata = {
            id: programId,
            programStageId: programStage.id,
            dataElements: dataElements,
            orgUnitId: orgUnitId,
        };
        return program;
    }

    private async getProgram(api: D2Api, programUid: string): Async<UserMonitoringD2Program[]> {
        log.info(`Get metadata: Program metadata: ${programUid}`);
        //todo use d2api filters
        const responses = await api
            .get<Programs>(
                `/programs?filter=id:eq:${programUid}&fields=id,organisationUnits[id],programStages[id,programStageDataElements[id,dataElement[id,name,code]]&paging=false.json`
            )
            .getData();

        return responses.programs;
    }
}
type Programs = { programs: UserMonitoringD2Program[] };
