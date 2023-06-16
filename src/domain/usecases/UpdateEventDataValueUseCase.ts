import _ from "lodash";
import { createObjectCsvWriter } from "csv-writer";
import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { EventMetadata, Stats } from "domain/entities/Event";
import { EventRepository } from "domain/repositories/EventRepository";
import logger from "utils/log";

export type MigrateOptions = {
    eventId: Id[];
    dataElementId: Id;
    condition: string;
    newValue: string;
    csvPath: string;
    post: boolean;
};

export class UpdateEventDataValueUseCase {
    constructor(private eventRepository: EventRepository) {}

    async execute(options: MigrateOptions): Async<Stats> {
        const eventMetadata = await this.eventRepository.getByIds(options.eventId);
        const eventsWithDvInCondition = this.getEventsInCondition(eventMetadata, options);

        if (options.csvPath) {
            console.debug(`Generate report: ${options.csvPath}`);
            await this.generateCsvReport(eventMetadata, options);
        }

        if (options.post) {
            console.debug(`Events to change: ${eventsWithDvInCondition.length}`);
            const stats = await this.eventRepository.saveAll(eventsWithDvInCondition);
            return stats;
        }

        return {
            created: 0,
            ignored: 0,
            updated: 0,
        };
    }

    private async generateCsvReport(events: EventMetadata[], options: MigrateOptions) {
        const csvWriter = createObjectCsvWriter({
            path: options.csvPath,
            header: [
                {
                    id: "event",
                    title: "Event",
                },
                {
                    id: "dataElement",
                    title: "Data Element",
                },
                {
                    id: "oldValue",
                    title: "Old Value",
                },
                {
                    id: "value",
                    title: "New Value",
                },
            ],
        });

        const csvData = _(events)
            .map(event => {
                const dv = event.dataValues.find(dv => dv.dataElement === options.dataElementId);
                if (!dv) return undefined;
                return {
                    event: event.event,
                    dataElement: dv.dataElement,
                    oldValue: dv.value,
                    value: options.newValue,
                };
            })
            .compact()
            .filter(dv => dv.dataElement === options.dataElementId && dv.oldValue === options.condition)
            .value();

        await csvWriter.writeRecords(csvData);
    }

    private getEventsInCondition(events: EventMetadata[], options: MigrateOptions) {
        const eventsWithDvInCondition = events
            .map(event => {
                const onlyDvInCondition = event.dataValues.map(dv => {
                    return {
                        ...dv,
                        value: dv.value === options.condition ? options.newValue : dv.value,
                    };
                });
                return {
                    ...event,
                    dataValues: onlyDvInCondition,
                };
            })
            .filter(
                event => event.dataValues.filter(dv => dv.dataElement === options.dataElementId).length > 0
            );

        return eventsWithDvInCondition;
    }
}
