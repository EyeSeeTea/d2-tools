import _ from "lodash";
import { D2Api } from "types/d2-api";
import { Async } from "domain/entities/Async";
import { Event } from "domain/entities/enrollments/Event";
import { EventsRepositoryParams, EventsRepository } from "domain/repositories/enrollments/EventsRepository";

export class EventsD2Repository implements EventsRepository {
    constructor(private api: D2Api) {}

    async getAll(params: EventsRepositoryParams): Async<Event[]> {
        const { instances: events } = (await this.api.tracker.events
            .get({
                orgUnit: params.orgUnitId,
                program: params.programId,
                ouMode: "SELECTED",
                updatedBefore: params.eventUpdateCutoff,
                order: "enrollment,updatedAt",
                fields: {
                    event: true,
                    program: true,
                    orgUnit: true,
                    status: true,
                    updatedAt: true,
                    enrollment: true,
                    enrollmentStatus: true,
                },
                skipPaging: true,
            })
            .getData()) as { instances: Event[] };

        return events;
    }
}
