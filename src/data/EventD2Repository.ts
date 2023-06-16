import _ from "lodash";

import { Async } from "domain/entities/Async";
import { D2Api, EventsGetRequest } from "types/d2-api";
import { getInChunks } from "./dhis2-utils";
import { Id } from "domain/entities/Base";
import { EventMetadata, Stats } from "domain/entities/Event";
import { EventRepository } from "domain/repositories/EventRepository";
import logger from "utils/log";

type EventsRequestWithFilter = EventsGetRequest & { fields: string; event: string[] };
const eventsFields = "event,eventDate,status,orgUnit,program,programStage,dataValues[dataElement,value]";

export class EventD2Repository implements EventRepository {
    constructor(private api: D2Api) {}

    async getByIds(ids: Id[]): Async<EventMetadata[]> {
        const dataValues = await getInChunks(ids, async eventIds => {
            return this.api.events
                .get({
                    event: eventIds.join(";"),
                    fields: eventsFields,
                    totalPages: true,
                    pageSize: 1e6,
                } as EventsRequestWithFilter)
                .getData()
                .then(res => {
                    return res.events.map(event => {
                        return {
                            event: event.event,
                            orgUnit: event.orgUnit,
                            program: event.program,
                            eventDate: event.eventDate,
                            status: event.status,
                            programStage: event.programStage,
                            dataValues: event.dataValues.map(dv => ({
                                dataElement: dv.dataElement,
                                value: dv.value,
                            })),
                        };
                    });
                })
                .catch(() => {
                    logger.error(`Error getting events: ${eventIds.join(",")}`);
                    return [];
                });
        });
        return dataValues;
    }

    async saveAll(events: EventMetadata[]): Promise<Stats> {
        const eventsIdsToSave = events.map(event => event.event);
        const stats = await getInChunks<Stats>(eventsIdsToSave, async eventIds => {
            return this.api.events
                .get({
                    event: eventIds.join(";"),
                    fields: eventsFields,
                    totalPages: true,
                    pageSize: 1e6,
                } as EventsRequestWithFilter)
                .getData()
                .then(res => {
                    const postEvents = eventIds.map(eventId => {
                        const existingD2Event = res.events.find(d2Event => d2Event.event === eventId);
                        const event = events.find(event => event.event === eventId);
                        if (!event) {
                            throw Error("Cannot find event");
                        }
                        return {
                            ...(existingD2Event || {}),
                            ...event,
                        };
                    });
                    return postEvents;
                })
                .then(eventsToSave => {
                    return this.api.events.post({}, { events: eventsToSave }).response();
                })
                .then(responses => {
                    const response = responses.data.response;

                    return [
                        {
                            created: response.imported,
                            ignored: response.ignored,
                            updated: response.updated,
                        },
                    ];
                })
                .catch(() => {
                    console.error(`Error getting events: ${eventIds.join(",")}`);
                    return [
                        {
                            created: 0,
                            ignored: eventIds.length,
                            updated: 0,
                        },
                    ];
                });
        });

        return stats.reduce(
            (acum, stat) => {
                return {
                    created: acum.created + stat.created,
                    ignored: acum.ignored + stat.ignored,
                    updated: acum.updated + stat.updated,
                };
            },
            {
                created: 0,
                ignored: 0,
                updated: 0,
            }
        );
    }
}
