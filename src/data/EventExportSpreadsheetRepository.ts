import _ from "lodash";
import { createObjectCsvWriter } from "csv-writer";
import { EventExportRepository } from "domain/repositories/EventExportRepository";
import { Async } from "domain/entities/Async";
import { MigrateOptions } from "domain/usecases/UpdateEventDataValueUseCase";
import { ProgramEvent } from "domain/entities/ProgramEvent";

export class EventExportSpreadsheetRepository implements EventExportRepository {
    async saveReport(events: ProgramEvent[], options: MigrateOptions): Async<void> {
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
            .flatMap(event => {
                return event.dataValues
                    .filter(dv => dv.dataElementId === options.dataElementId)
                    .map(dv => ({
                        event: event.id,
                        dataElement: dv.dataElementId,
                        oldValue: dv.oldValue,
                        value: options.newValue,
                    }));
            })
            .compact()
            .value();

        await csvWriter.writeRecords(csvData);
    }
}
