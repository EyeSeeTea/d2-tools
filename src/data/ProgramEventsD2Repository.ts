import { Event } from "@eyeseetea/d2-api/api/events";
import { Async } from "domain/entities/Async";
import { ProgramEvent } from "domain/entities/ProgramEvent";
import { GetOptions, ProgramEventsRepository } from "domain/repositories/ProgramEventsRepository";
import { D2Api } from "types/d2-api";
import { cartesianProduct } from "utils/array";
import logger from "utils/log";

export class ProgramEventsD2Repository implements ProgramEventsRepository {
    constructor(private api: D2Api) {}

    async get(options: GetOptions): Async<ProgramEvent[]> {
        const d2Events = await this.getD2Events(options);

        return d2Events.map(event => ({
            created: event.created,
            id: event.event,
            programId: event.program,
            programStageId: event.programStage,
            orgUnitId: event.orgUnit,
            trackedEntityInstanceId: (event as D2Event).trackedEntityInstance,
            dataValues: event.dataValues.map(dv => ({
                dataElementId: dv.dataElement,
                value: dv.value,
            })),
        }));
    }

    private async getD2Events(options: GetOptions): Promise<Event[]> {
        const allEvents: Event[] = [];

        const products = cartesianProduct(
            options.orgUnitsIds,
            options.programIds,
            options.programStagesIds || [undefined]
        );

        for (const [orgUnitId, programId, programStageId] of products) {
            let pendingPages = true;
            let page = 1;

            while (pendingPages) {
                const getEventsOptions = {
                    orgUnit: orgUnitId || "",
                    program: programId,
                    programStage: programStageId,
                    ouMode: options.orgUnitMode || "SELECTED",
                    startDate: options.startDate,
                    endDate: options.endDate,
                    totalPages: true,
                    page: page,
                    pageSize: 1_000,
                };
                logger.debug(`Get API events: ${JSON.stringify(getEventsOptions)}`);

                const { pager, events } = await this.api.events.get(getEventsOptions).getData();
                allEvents.push(...events);
                page++;
                if (pager.page >= pager.pageCount) pendingPages = false;
            }
        }

        return allEvents;
    }
}

interface D2Event extends Event {
    trackedEntityInstance?: string; // Property missing in d2-api
}
