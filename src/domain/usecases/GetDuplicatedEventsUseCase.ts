import _ from "lodash";
import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { Timestamp } from "domain/entities/Date";
import { ProgramEventsRepository } from "domain/repositories/ProgramEventsRepository";
import { DuplicatedProgramEvents } from "domain/entities/ProgramEvent";
import logger from "utils/log";

export class GetDuplicatedEventsUseCase {
    constructor(private eventsRepository: ProgramEventsRepository) {}

    async execute(options: GetDuplicatedEventsOptions): Async<void> {
        logger.debug(`Get events: ${JSON.stringify(options)}`);
        const events = await this.eventsRepository.get(options);
        logger.debug(`Events: ${events.length}`);

        const duplicatedEvents = new DuplicatedProgramEvents(options).get(events);
        logger.debug(`Duplicated events: ${duplicatedEvents.length}`);
        // Create CSV report (maybe XLXS?)
        // Add --post
    }
}

export const orgUnitModes = ["SELECTED", "CHILDREN", "DESCENDANTS"] as const;

export type OrgUnitMode = typeof orgUnitModes[number];

interface GetDuplicatedEventsOptions {
    programIds: Id[];
    orgUnitsIds: Id[];
    orgUnitMode?: OrgUnitMode;
    startDate?: Timestamp;
    endDate?: Timestamp;
    ignoreDataElementsIds?: Id[];
}
