import _ from "lodash";
import { Event } from "@eyeseetea/d2-api/api/events";
import { Async } from "domain/entities/Async";
import { ProgramEvent } from "domain/entities/ProgramEvent";
import { GetOptions, ProgramEventsRepository } from "domain/repositories/ProgramEventsRepository";
import { D2Api, EventsPostRequest, EventsPostParams, Ref } from "types/d2-api";
import { cartesianProduct } from "utils/array";
import logger from "utils/log";
import { getId, Id } from "domain/entities/Base";
import { Result } from "domain/entities/Result";

export class ProgramEventsD2Repository implements ProgramEventsRepository {
    constructor(private api: D2Api) {}

    async get(options: GetOptions): Async<ProgramEvent[]> {
        const d2Events = await this.getD2Events(options);

        const { programs } = await this.api.metadata
            .get({
                programs: {
                    fields: {
                        id: true,
                        name: true,
                        programStages: { id: true, name: true },
                    },
                },
            })
            .getData();

        const programsById = _.keyBy(programs, getId);

        const programStagesById = _(programs)
            .flatMap(program => program.programStages)
            .uniqBy(getId)
            .keyBy(getId)
            .value();

        return d2Events.map(event => ({
            created: event.created,
            id: event.event,
            program: programsById[event.program] || { id: event.program, name: "" },
            programStage: programStagesById[event.programStage] || { id: event.programStage, name: "" },
            orgUnit: { id: event.orgUnit, name: event.orgUnitName },
            trackedEntityInstanceId: (event as D2Event).trackedEntityInstance,
            status: event.status,
            date: event.eventDate,
            dataValues: event.dataValues.map(dv => ({
                dataElementId: dv.dataElement,
                value: dv.value,
            })),
        }));
    }

    async delete(events: Ref[]): Async<Result> {
        const d2Events = events.map(ev => ({ event: ev.id })) as EventToPost[];
        return importEvents(this.api, d2Events, { strategy: "DELETE" });
    }

    async save(events: ProgramEvent[]): Async<Result> {
        const d2Events = events.map((event): EventToPost => {
            return {
                event: event.id,
                program: event.program.id,
                programStage: event.programStage.id,
                trackedEntityInstance: event.trackedEntityInstanceId,
                orgUnit: event.orgUnit.id,
                status: event.status,
                eventDate: event.date,
                dataValues: event.dataValues.map(dv => ({
                    dataElement: dv.dataElementId,
                    value: dv.value,
                })),
            };
        });

        return importEvents(this.api, d2Events, { strategy: "CREATE_AND_UPDATE" });
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

type EventToPost = EventsPostRequest["events"][number] & { event: Id };

async function importEvents(api: D2Api, events: EventToPost[], params?: EventsPostParams): Async<Result> {
    if (_.isEmpty(events)) {
        return { type: "success", message: "No events to post" };
    } else {
        const res = await api.events.post(params || {}, { events }).getData();

        if (res.response.status === "SUCCESS") {
            const message = JSON.stringify(
                _.pick(res.response, ["status", "imported", "updated", "deleted", "ignored"])
            );
            return { type: "success", message };
        } else {
            const message = JSON.stringify(res.response, null, 4);
            return { type: "error", message };
        }
    }
}
