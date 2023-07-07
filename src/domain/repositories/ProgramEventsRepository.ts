import { Async } from "domain/entities/Async";
import { Id, Ref } from "domain/entities/Base";
import { Timestamp } from "domain/entities/Date";
import { ProgramEvent, ProgramEventToSave } from "domain/entities/ProgramEvent";
import { Result } from "domain/entities/Result";

export interface ProgramEventsRepository {
    get(options: GetOptions): Async<ProgramEvent[]>;
    save(events: ProgramEventToSave[]): Async<Result>;
    delete(events: Ref[]): Async<Result>;
}

export interface GetOptions {
    programIds?: Id[];
    programStagesIds?: Id[];
    orgUnitsIds: Id[];
    orgUnitMode?: "SELECTED" | "CHILDREN" | "DESCENDANTS";
    startDate?: Timestamp;
    endDate?: Timestamp;
    eventsIds?: Id[];
}
