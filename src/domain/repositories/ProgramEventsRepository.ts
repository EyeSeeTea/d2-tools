import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { Timestamp } from "domain/entities/Date";
import { ProgramEvent } from "domain/entities/ProgramEvent";

export interface ProgramEventsRepository {
    get(options: GetOptions): Async<ProgramEvent[]>;
}

export interface GetOptions {
    programIds?: Id[];
    programStagesIds?: Id[];
    orgUnitsIds?: Id[];
    startDate?: Timestamp;
    endDate?: Timestamp;
}
