import _ from "lodash";
import { Async } from "domain/entities/Async";
import { NamedRef } from "domain/entities/Base";
import {
    ProgramEventsExportRepository,
    ProgramEventsExportSaveOptions,
} from "domain/repositories/ProgramEventsExportRepository";
import * as CsvWriter from "csv-writer";

export class ProgramEventsExportCsvRepository implements ProgramEventsExportRepository {
    async save(options: ProgramEventsExportSaveOptions): Async<void> {
        const { events, outputPath: reportPath } = options;
        const createCsvWriter = CsvWriter.createObjectCsvWriter;
        const csvHeader = _.map(headers, (obj, key) => ({ id: key, ...obj }));
        const csvWriter = createCsvWriter({ path: reportPath, header: csvHeader });
        const formatObj = (obj: NamedRef) => `${obj.name.trim()} [${obj.id}]`;

        const records = events.map((event): Row => {
            return {
                id: event.id,
                program: formatObj(event.program),
                programStage: formatObj(event.programStage),
                orgUnit: formatObj(event.orgUnit),
                teiId: event.trackedEntityInstanceId || "-",
                dataValues: event.dataValues.map(dv => `${dv.dataElementId}=${dv.value}`).join(", "),
                created: event.created,
                date: event.date,
                status: event.status,
            };
        });

        await csvWriter.writeRecords(records);
    }
}

type Attr =
    | "id"
    | "program"
    | "programStage"
    | "orgUnit"
    | "teiId"
    | "dataValues"
    | "created"
    | "status"
    | "date";

type Row = Record<Attr, string>;

const headers: Record<Attr, { title: string }> = {
    id: { title: "Event ID" },
    date: { title: "Event Date" },
    created: { title: "Created" },
    status: { title: "Status" },
    program: { title: "Program" },
    programStage: { title: "Program Stage" },
    orgUnit: { title: "Org Unit" },
    teiId: { title: "TEI ID" },
    dataValues: { title: "Data values" },
};
