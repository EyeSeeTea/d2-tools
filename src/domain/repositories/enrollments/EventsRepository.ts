import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { Event } from "domain/entities/enrollments/Event";

export interface EventsRepository {
    getAll(params: EventsRepositoryParams): Async<Event[]>;
}

export type EventsRepositoryParams = {
    programId?: Id;
    orgUnitId?: Id;
    children?: boolean;
    eventUpdateCutoff?: string;
};
