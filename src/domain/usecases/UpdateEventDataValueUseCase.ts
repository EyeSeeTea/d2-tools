import _ from "lodash";
import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { Result } from "domain/entities/Result";
import logger from "utils/log";
import { EventExportSpreadsheetRepository } from "data/EventExportSpreadsheetRepository";
import { ProgramEventsRepository } from "domain/repositories/ProgramEventsRepository";
import { ProgramEvent } from "domain/entities/ProgramEvent";

export type MigrateOptions = {
    eventIds: Id[];
    rootOrgUnit: Id;
    dataElementId: Id;
    condition: string;
    newValue: string;
    csvPath: string;
    post: boolean;
};

export class UpdateEventDataValueUseCase {
    constructor(
        private programEventsRepository: ProgramEventsRepository,
        private eventExportSpreadsheetRepository: EventExportSpreadsheetRepository
    ) {}

    async execute(options: MigrateOptions): Async<Result> {
        const eventMetadata = await this.programEventsRepository.get({
            eventsIds: options.eventIds,
            orgUnitsIds: [options.rootOrgUnit],
            orgUnitMode: "DESCENDANTS",
        });

        const eventsWithDvInCondition = this.getEventsInCondition(eventMetadata, options);

        logger.info(`Matching events: ${eventsWithDvInCondition.length}`);

        if (options.csvPath) {
            logger.debug(`Generate report: ${options.csvPath}`);
            await this.eventExportSpreadsheetRepository.saveReport(eventsWithDvInCondition, options);
        }

        if (options.post) {
            logger.debug(`Events to change: ${eventsWithDvInCondition.length}`);
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
                        dv => dv.dataElement.id === options.dataElementId && dv.value === options.newValue
                    ).length > 0
            );

        return eventsInCondition;
    }
}
