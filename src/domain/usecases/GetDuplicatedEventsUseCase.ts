import _ from "lodash";
import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { Timestamp } from "domain/entities/Date";
import { ProgramEventsRepository } from "domain/repositories/ProgramEventsRepository";
import { DuplicatedProgramEvents } from "domain/entities/ProgramEvent";

export class GetDuplicatedEventsUseCase {
    constructor(private eventsRepository: ProgramEventsRepository) {}

    async execute(options: GetDuplicatedEventsOptions): Async<void> {
        const events = await this.eventsRepository.get(options);
        console.log(events.length);

        const duplicatedEvents = new DuplicatedProgramEvents().get(events);
        console.log(duplicatedEvents.length);
    }
}

interface GetDuplicatedEventsOptions {
    programIds?: Id[];
    orgUnitsIds?: Id[];
    startDate?: Timestamp;
    endDate?: Timestamp;
}
