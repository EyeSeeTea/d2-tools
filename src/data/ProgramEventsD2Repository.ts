import { Event } from "@eyeseetea/d2-api/api/events";
import { Async } from "domain/entities/Async";
import { ProgramEvent } from "domain/entities/ProgramEvent";
import { GetOptions, ProgramEventsRepository } from "domain/repositories/ProgramEventsRepository";
import { D2Api } from "types/d2-api";

export class ProgramEventsD2Repository implements ProgramEventsRepository {
    constructor(private api: D2Api) {}

    async get(options: GetOptions): Async<ProgramEvent[]> {
        const { events } = await this.api.events
            .get({
                program: options.programIds,
                programStage: options.programStagesIds,
                orgUnit: options.orgUnitsIds,
            })
            .getData();

        return events.map(event => ({
            id: event.event,
            programId: event.program,
            programStageId: event.programStage,
            orgUnitId: event.orgUnit,
            trackedEntityInstanceId: (event as D2Event).trackedEntityInstance,
            dataValues: event.dataValues.map(dv => ({ dataElementId: dv.dataElement, value: dv.value })),
        }));
    }
}

interface D2Event extends Event {
    trackedEntityInstance?: string;
}
