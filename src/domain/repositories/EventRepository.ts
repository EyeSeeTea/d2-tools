import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { EventMetadata, Stats } from "domain/entities/Event";

export interface EventRepository {
    getByIds(ids: Id[]): Async<EventMetadata[]>;
    saveAll(events: EventMetadata[]): Async<Stats>;
}
