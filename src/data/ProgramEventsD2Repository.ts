import _ from "lodash";
import { EventsGetResponse, PaginatedEventsGetResponse } from "@eyeseetea/d2-api/api/events";
import { Async } from "domain/entities/Async";
import { ProgramEvent } from "domain/entities/ProgramEvent";
import { GetOptions, ProgramEventsRepository } from "domain/repositories/ProgramEventsRepository";
import { D2Api, EventsPostRequest, EventsPostParams, Ref } from "types/d2-api";
import { cartesianProduct } from "utils/array";
import logger from "utils/log";
import { getId, Id } from "domain/entities/Base";
import { Result } from "domain/entities/Result";
import { Timestamp } from "domain/entities/Date";
import { getInChunks } from "./dhis2-utils";
import { promiseMap } from "./dhis2-utils";

const eventFields = {
    created: true,
    event: true,
    status: true,
    orgUnit: true,
    orgUnitName: true,
    program: true,
    programStage: true,
    eventDate: true,
    dueDate: true,
    lastUpdated: true,
    trackedEntityInstance: true,
    dataValues: {
        dataElement: true,
        value: true,
        storedBy: true,
        providedElsewhere: true,
        lastUpdated: true,
    },
} as const;

type Fields = typeof eventFields;

type Event = EventsGetResponse<Fields>["events"][number];

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
            dueDate: event.dueDate,
            dataValues: event.dataValues.map(dv => ({
                dataElementId: dv.dataElement,
                value: dv.value,
                storedBy: dv.storedBy,
                providedElsewhere: dv.providedElsewhere,
                lastUpdated: dv.lastUpdated,
            })),
        }));
    }

    async delete(events: Ref[]): Async<Result> {
        const d2Events = events.map(ev => ({ event: ev.id })) as EventToPost[];
        return importEvents(this.api, d2Events, { strategy: "DELETE" });
    }

    async save(events: ProgramEvent[]): Async<Result> {
        const eventsIdsToSave = events.map(event => event.id);
        const eventsById = _(events)
            .keyBy(event => event.id)
            .value();

        const resultsList = await getInChunks<Result>(eventsIdsToSave, async eventIds => {
            return this.getEvents(eventIds)
                .then(res => {
                    const postEvents = eventIds.map((eventId): EventToPost => {
                        const existingD2Event = res.events.find(d2Event => d2Event.event === eventId);
                        const event = eventsById[eventId];
                        if (!event) {
                            throw Error("Cannot find event");
                        }
                        return {
                            ...(existingD2Event || {}),
                            event: event.id,
                            program: event.program.id,
                            programStage: event.programStage.id,
                            orgUnit: event.orgUnit.id,
                            status: event.status,
                            dueDate: event.dueDate,
                            eventDate: event.date,
                            dataValues: event.dataValues.map(dv => {
                                return {
                                    dataElement: dv.dataElementId,
                                    value: dv.value,
                                    storedBy: dv.storedBy,
                                    providedElsewhere: dv.providedElsewhere,
                                    lastUpdated: dv.lastUpdated,
                                };
                            }),
                        };
                    });
                    return postEvents;
                })
                .then(eventsToSave => {
                    return importEvents(this.api, eventsToSave, { strategy: "CREATE_AND_UPDATE" });
                })
                .then(responses => {
                    return [responses];
                })
                .catch(() => {
                    const message = `Error getting events: ${eventIds.join(",")}`;
                    console.error(message);
                    return [
                        {
                            type: "error",
                            message,
                        },
                    ];
                });
        });

        if (resultsList.length > 0) {
            const type =
                resultsList.filter(result => result.type === "success").length > 0 ? "success" : "error";
            const message = resultsList.map(result => result.message).join("");
            return {
                type,
                message: message,
            };
        } else {
            return {
                type: "success",
            };
        }
    }

    private async getD2Events(options: GetOptions): Promise<Event[]> {
        const allEvents: Event[] = [];

        const products = cartesianProduct(
            options.orgUnitsIds,
            options.programIds || [undefined],
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
                    fields: eventFields,
                    event: options.eventsIds?.join(";"),
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

    private getEvents(eventIds: Id[]): Async<PaginatedEventsGetResponse<Fields>> {
        return this.api.events
            .get({
                event: eventIds.join(";"),
                fields: eventFields,
                totalPages: true,
                pageSize: 1e6,
            })
            .getData();
    }
}

interface D2Event {
    event: string;
    status: Event["status"];
    orgUnit: Id;
    orgUnitName: string;
    program: Id;
    dataValues: Array<{ dataElement: Id; value: string; storedBy: string }>;
    eventDate: Timestamp;
    dueDate: Timestamp;
    trackedEntityInstance?: Id;
}

type EventToPost = EventsPostRequest["events"][number] & { event: Id; dueDate: Timestamp };

async function importEvents(api: D2Api, events: EventToPost[], params?: EventsPostParams): Async<Result> {
    if (_.isEmpty(events)) return { type: "success", message: "No events to post" };

    const resList = await promiseMap(_.chunk(events, 100), async eventsGroup => {
        const res = await api.events.post(params || {}, { events: eventsGroup }).getData();
        if (res.response.status === "SUCCESS") {
            const message = JSON.stringify(
                _.pick(res.response, ["status", "imported", "updated", "deleted", "ignored"])
            );
            logger.info(`Post events OK: ${message}`);
            return true;
        } else {
            const message = JSON.stringify(res.response, null, 4);
            logger.info(`Post events ERROR: ${message}`);
            return false;
        }
    });

    const isSuccess = _.every(resList);

    return isSuccess
        ? { type: "success", message: `${events.length} posted` }
        : { type: "error", message: "Error posting events" };
}
