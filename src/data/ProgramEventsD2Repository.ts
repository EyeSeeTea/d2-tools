import _ from "lodash";
import { Async } from "domain/entities/Async";
import { ProgramEvent } from "domain/entities/ProgramEvent";
import { GetOptions, ProgramEventsRepository } from "domain/repositories/ProgramEventsRepository";
import { D2Api, Ref } from "types/d2-api";
import { cartesianProduct } from "utils/array";
import logger from "utils/log";
import { getId, Id, NamedRef } from "domain/entities/Base";
import { Result } from "domain/entities/Result";
import { getInChunks } from "./dhis2-utils";
import { promiseMap } from "./dhis2-utils";
import { TrackerPostParams, TrackerPostRequest } from "@eyeseetea/d2-api/api/tracker";
import { TrackerEventsResponse } from "@eyeseetea/d2-api/api/trackerEvents";

const eventFields = {
    createdAt: true,
    event: true,
    status: true,
    orgUnit: true,
    orgUnitName: true,
    program: true,
    programStage: true,
    occurredAt: true,
    scheduledAt: true,
    lastUpdated: true,
    trackedEntity: true,
    dataValues: {
        dataElement: true,
        value: true,
        storedBy: true,
        providedElsewhere: true,
        updatedAt: true,
    },
} as const;

type Fields = typeof eventFields;

type Event = TrackerEventsResponse<Fields>["instances"][number];

export class ProgramEventsD2Repository implements ProgramEventsRepository {
    constructor(private api: D2Api) {}

    async get(options: GetOptions): Async<ProgramEvent[]> {
        const d2EventsMapper = await D2EventsMapper.build(this.api);
        const d2Events = await this.getD2Events(options);

        return d2Events.map(d2Event => d2EventsMapper.getEventEntityFromD2Object(d2Event));
    }

    async delete(events: Ref[]): Async<Result> {
        const d2Events = events.map(ev => ({ event: ev.id })) as EventToPost[];
        return importEvents(this.api, d2Events, { importStrategy: "DELETE" });
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
                        const existingD2Event = res.instances.find(d2Event => d2Event.event === eventId);
                        const event = eventsById[eventId];
                        if (!event) {
                            throw Error("Cannot find event");
                        }
                        return {
                            ...existingD2Event,
                            event: event.id,
                            program: event.program.id,
                            programStage: event.programStage.id,
                            orgUnit: event.orgUnit.id,
                            status: event.status,
                            scheduledAt: event.dueDate,
                            occurredAt: event.date,
                            dataValues: event.dataValues.map(dv => ({
                                dataElement: dv.dataElementId,
                                value: dv.value,
                                storedBy: dv.storedBy,
                                providedElsewhere: dv.providedElsewhere,
                                updatedAt: dv.lastUpdated,
                            })),
                        };
                    });
                    return postEvents;
                })
                .then(eventsToSave => {
                    return importEvents(this.api, eventsToSave, { importStrategy: "CREATE_AND_UPDATE" });
                })
                .then(responses => {
                    return [responses];
                })
                .catch(() => {
                    const message = `Error getting events: ${eventIds.join(",")}`;
                    console.error(message);
                    return [{ type: "error", message }];
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
                const res = await this.api.tracker.events.get(getEventsOptions).getData();
                const pageCount = Math.ceil((res.total || 0) / res.pageSize);

                allEvents.push(...res.instances);
                page++;
                if (res.page >= pageCount) pendingPages = false;
            }
        }

        return allEvents;
    }

    private getEvents(eventIds: Id[]) {
        return this.api.tracker.events
            .get({
                event: eventIds.join(";"),
                fields: eventFields,
                totalPages: true,
                pageSize: eventIds.length,
            })
            .getData();
    }
}

export class D2EventsMapper {
    constructor(
        private programsById: Record<Id, NamedRef>,
        private programStagesById: Record<Id, NamedRef>
    ) {}

    static async build(api: D2Api) {
        const { programs } = await api.metadata
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

        return new D2EventsMapper(programsById, programStagesById);
    }

    getEventEntityFromD2Object(event: Event): ProgramEvent {
        return {
            id: event.event,
            created: event.createdAt,
            program: this.programsById[event.program] || { id: event.program, name: "" },
            programStage: this.programStagesById[event.programStage] || { id: event.programStage, name: "" },
            orgUnit: { id: event.orgUnit, name: event.orgUnitName },
            trackedEntityInstanceId: event.trackedEntity,
            status: event.status,
            date: event.occurredAt,
            dueDate: event.scheduledAt,
            dataValues: event.dataValues.map(dv => ({
                dataElementId: dv.dataElement,
                value: dv.value,
                storedBy: dv.storedBy,
                providedElsewhere: dv.providedElsewhere,
                lastUpdated: dv.updatedAt,
            })),
        };
    }
}

type EventToPost = NonNullable<TrackerPostRequest["events"]>[number];

async function importEvents(api: D2Api, events: EventToPost[], params?: TrackerPostParams): Async<Result> {
    if (_.isEmpty(events)) return { type: "success", message: "No events to post" };

    const resList = await promiseMap(_.chunk(events, 100), async eventsGroup => {
        const res = await api.tracker
            .post(
                {
                    async: false,
                    skipPatternValidation: true,
                    skipSideEffects: true,
                    skipRuleEngine: true,
                    importMode: "COMMIT",
                    ...params,
                },
                { events: eventsGroup }
            )
            .getData();
        if (res.status === "OK") {
            const message = JSON.stringify(
                _.pick(res, ["status", "imported", "updated", "deleted", "ignored"])
            );
            logger.info(`Post events OK: ${message}`);
            return true;
        } else {
            const message = JSON.stringify(res, null, 4);
            logger.info(`Post events ERROR: ${message}`);
            return false;
        }
    });

    const isSuccess = _.every(resList);

    return isSuccess
        ? { type: "success", message: `${events.length} posted` }
        : { type: "error", message: "Error posting events" };
}
