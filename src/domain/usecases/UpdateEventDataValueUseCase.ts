import _ from "lodash";
import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { Result } from "domain/entities/Result";
import { Logger } from "domain/logger/Logger";
import { EventExportSpreadsheetRepository } from "data/EventExportSpreadsheetRepository";
import { ProgramEventsRepository } from "domain/repositories/ProgramEventsRepository";
import { ProgramEvent } from "domain/entities/ProgramEvent";

export type MigrateOptions = {
    eventIds: Id[];
    rootOrgUnit: Id;
    dataElementId: Id;
    condition: string;
    newValue: string;
    reportPath: string;
    post: boolean;
    updateSameValue: boolean;
};

export class UpdateEventDataValueUseCase {
    private readonly eventChunkSize = 200;

    constructor(
        private logger: Logger,
        private programEventsRepository: ProgramEventsRepository,
        private eventExportSpreadsheetRepository: EventExportSpreadsheetRepository
    ) {}

    async execute(options: MigrateOptions): Async<Result> {
        const eventIdsLength = options.eventIds.length;

        let eventMetadata: ProgramEvent[] = [];
        for (let i = 0; i < eventIdsLength; i += this.eventChunkSize) {
            this.logger.debug(
                `Fetching events metadata for events ${i + 1} to ${Math.min(
                    i + this.eventChunkSize,
                    eventIdsLength
                )} of ${eventIdsLength}`
            );

            const eventIdsChunk = options.eventIds.slice(i, i + this.eventChunkSize);
            const eventMetadataChunk = await this.programEventsRepository.get({
                eventsIds: eventIdsChunk,
                orgUnitsIds: [options.rootOrgUnit],
                orgUnitMode: "DESCENDANTS",
            });

            eventMetadata = eventMetadata.concat(eventMetadataChunk);
        }

        const eventsWithDvInCondition = this.getEventsInCondition(eventMetadata, options);

        if (eventsWithDvInCondition.length === 0) {
            this.logger.info("No events found with the specified condition");
            return {
                type: "success",
                message: "No events found with the specified condition",
            };
        }

        this.logger.info(`Matching events: ${eventsWithDvInCondition.length}`);

        if (options.reportPath) {
            this.logger.debug(`Generate report: ${options.reportPath}`);
            await this.eventExportSpreadsheetRepository.saveReport(eventsWithDvInCondition, options);
        }

        if (options.post) {
            this.logger.debug(`Events to change: ${eventsWithDvInCondition.length}`);
            const result = await this.programEventsRepository.save(eventsWithDvInCondition);
            return result;
        } else {
            return {
                type: "success",
            };
        }
    }

    private getEventsInCondition(events: ProgramEvent[], options: MigrateOptions) {
        const eventsInCondition = events
            .map(event => {
                const onlyDvInCondition = event.dataValues.map(dv => {
                    return {
                        ...dv,
                        oldValue: dv.value,
                        value:
                            dv.dataElement.id === options.dataElementId && dv.value === options.condition
                                ? options.newValue
                                : dv.value,
                    };
                });
                return {
                    ...event,
                    dataValues: onlyDvInCondition,
                };
            })
            .filter(
                event =>
                    event.dataValues.filter(
                        dv =>
                            dv.dataElement.id === options.dataElementId &&
                            dv.value === options.newValue &&
                            (options.updateSameValue || dv.oldValue !== dv.value)
                    ).length > 0
            );

        return eventsInCondition;
    }
}
