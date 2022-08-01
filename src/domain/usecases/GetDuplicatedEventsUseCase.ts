import _ from "lodash";
import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { Timestamp } from "domain/entities/Date";
import { ProgramEventsRepository } from "domain/repositories/ProgramEventsRepository";
import { DuplicatedProgramEvents } from "domain/entities/ProgramEvent";
import logger from "utils/log";
import { ProgramEventsExportRepository } from "domain/repositories/ProgramEventsExportRepository";

export class GetDuplicatedEventsUseCase {
    constructor(
        private eventsRepository: ProgramEventsRepository,
        private reportsRepository: ProgramEventsExportRepository
    ) {}

    async execute(options: GetDuplicatedEventsOptions): Async<void> {
        logger.debug(`Get events: ${JSON.stringify(options)}`);
        const events = await this.eventsRepository.get(options);
        logger.debug(`Events: ${events.length}`);

        const duplicatedEvents = new DuplicatedProgramEvents(options).get(events);
        logger.debug(`Duplicated events: ${duplicatedEvents.length}`);

        if (options.saveReport) {
            await this.reportsRepository.save({ outputPath: options.saveReport, events: duplicatedEvents });
            logger.info(`Report: ${options.saveReport}`);
        }

        if (options.post) {
            const result = await this.eventsRepository.delete(duplicatedEvents);

            if (result.type === "success") {
                logger.info(`POST successful: ${result.message}`);
            } else {
                logger.error(`POST error: ${result.message}`);
            }
        } else if (duplicatedEvents.length > 0) {
            logger.info(`Use --post to delete values on server`);
        }
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
    saveReport?: string;
    post: boolean;
}
