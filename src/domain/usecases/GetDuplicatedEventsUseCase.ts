import _ from "lodash";
import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { Timestamp } from "domain/entities/Date";
import { ProgramEventsRepository } from "domain/repositories/ProgramEventsRepository";
import { DuplicatedEvents, DuplicatedProgramEvents } from "domain/entities/ProgramEvent";
import logger from "utils/log";
import { Maybe } from "utils/ts-utils";

export class GetDuplicatedEventsUseCase {
    constructor(private eventsRepository: ProgramEventsRepository) {}

    async execute(options: GetDuplicatedEventsOptions): Async<DuplicatedEvents> {
        logger.debug(`Get events: ${JSON.stringify(options)}`);
        const events = await this.eventsRepository.get(options);
        logger.debug(`Events: ${events.length}`);

        const duplicated = new DuplicatedProgramEvents({
            ignoreDataElementsIds: options.ignoreDataElementsIds,
            checkDataElementsIds: options.checkDataElementsIds,
        }).get(events);

        logger.debug(`Duplicated groups: ${duplicated.groups.length}`);

        return duplicated;
    }
}

export const orgUnitModes = ["SELECTED", "CHILDREN", "DESCENDANTS"] as const;

export type OrgUnitMode = typeof orgUnitModes[number];

interface GetDuplicatedEventsOptions {
    programIds: Id[];
    orgUnitsIds: Id[];
    orgUnitMode?: OrgUnitMode;
    startDate: Maybe<Timestamp>;
    endDate: Maybe<Timestamp>;
    ignoreDataElementsIds: Maybe<Id[]>;
    checkDataElementsIds: Maybe<Id[]>;
    post: boolean;
}
