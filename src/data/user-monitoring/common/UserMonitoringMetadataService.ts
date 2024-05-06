import log from "utils/log";
import {
    DataElement,
    Program,
    ProgramMetadata,
    ProgramStage,
    ProgramStageDataElement,
} from "../d2-users/D2Users.types";
import { Async } from "domain/entities/Async";
import { D2Api } from "types/d2-api";

export class UserMonitoringMetadataService {
    async getMetadata(programId: string, api: D2Api): Promise<Async<ProgramMetadata>> {
        const responseProgram = await this.getProgram(api, programId);

        const programs = responseProgram[0] ?? undefined;

        if (programs === undefined) {
            log.error(`Program ${programId} not found`);
            throw new Error("Program ${pushProgramId} not found");
        }

        const programStage: ProgramStage | undefined = programs.programStages[0];

        const orgunitstring = JSON.stringify(programs.organisationUnits[0]);
        const orgUnit: { id: string } = JSON.parse(orgunitstring);
        const orgUnitId: string = orgUnit.id;

        if (programStage === undefined) {
            log.error(`Programstage ${programId} not found`);
            throw new Error(`ProgramStage in ${programId} not found`);
        }

        if (orgUnitId === undefined) {
            log.error(`Organisation Unit ${programId} not found`);
            throw new Error(`Program OrgUnit in ${programId} not found`);
        }

        const programStageDataElements: ProgramStageDataElement[] = programStage.programStageDataElements;

        const dataElements: DataElement[] = programStageDataElements.map(item => {
            return item.dataElement;
        });

        const program: ProgramMetadata = {
            id: programId,
            programStageId: programStage.id,
            dataElements: dataElements,
            orgUnitId: orgUnitId,
        };
        return program;
    }

    private async getProgram(api: D2Api, programUid: string): Promise<Program[]> {
        log.info(`Get metadata: Program metadata: ${programUid}`);

        const responses = await api
            .get<Programs>(
                `/programs?filter=id:eq:${programUid}&fields=id,organisationUnits[id],programStages[id,programStageDataElements[id,dataElement[id,name,code]]&paging=false.json`
            )
            .getData();

        return responses.programs;
    }
}
type Programs = { programs: Program[] };
