import fs from "fs";
import _ from "lodash";
import CsvReadableStream from "csv-reader";
import { command, string, subcommands, option, optional, flag } from "cmd-ts";

import {
    getApiUrlOption,
    getApiUrlOptions,
    getD2Api,
    getD2ApiFromArgs,
    StringsSeparatedByCommas,
} from "scripts/common";
import { ProgramEventsD2Repository } from "data/ProgramEventsD2Repository";
import { MoveEventsToOrgUnitUseCase } from "domain/usecases/MoveEventsToOrgUnitUseCase";
import logger from "utils/log";
import { TerminalLogger } from "utils/TerminalLogger";
import { UpdateEventDataValueUseCase } from "domain/usecases/UpdateEventDataValueUseCase";
import { EventExportSpreadsheetRepository } from "data/EventExportSpreadsheetRepository";
import { DetectExternalOrgUnitUseCase } from "domain/usecases/ProcessEventsOutsideEnrollmentOrgUnitUseCase";
import { ProgramsD2Repository } from "data/ProgramsD2Repository";
import { RecodeBooleanDataValuesInEventsUseCase } from "domain/usecases/RecodeBooleanDataValuesInEventsUseCase";
import { NotificationsEmailRepository } from "data/NotificationsEmailRepository";
import { TrackedEntityD2Repository } from "data/TrackedEntityD2Repository";
import { Id, Ref } from "domain/entities/Base";

export function getCommand() {
    return subcommands({
        name: "events",
        cmds: {
            "move-to-org-unit": moveOrgUnitCmd,
            "update-events": updateEventsDataValues,
            "recode-boolean-data-values": recodeBooleanDataValues,
            "detect-orgunits-outside-enrollment": detectEventsOutsideOrgUnitEnrollmentCmd,
        },
    });
}

const detectEventsOutsideOrgUnitEnrollmentCmd = command({
    name: "detect-external-orgunits",
    description: "Detect events assigned to organisation units outside their enrollment",
    args: {
        ...getApiUrlOptions(),
        post: flag({
            long: "post",
            description: "Fix events",
            defaultValue: () => false,
        }),
        notifyEmail: option({
            type: optional(StringsSeparatedByCommas),
            long: "notify-email",
            description: "SUBJECT,EMAIL1,EMAIL2,...",
        }),
        programIds: option({
            type: optional(StringsSeparatedByCommas),
            long: "program-ids",
            description: "List of program IDS (comma-separated)",
        }),
    },
    handler: async args => {
        const api = getD2ApiFromArgs(args);
        const programsRepository = new ProgramsD2Repository(api);
        const notificationRepository = new NotificationsEmailRepository();
        const eventsRepository = new ProgramEventsD2Repository(api);
        const trackedEntitiesRepository = new TrackedEntityD2Repository(api);
        const { notifyEmail } = args;
        const [subject, ...recipients] = notifyEmail || [];
        const notification =
            subject && recipients.length > 0 ? { subject: subject, recipients: recipients } : undefined;

        return new DetectExternalOrgUnitUseCase(
            programsRepository,
            trackedEntitiesRepository,
            eventsRepository,
            notificationRepository
        ).execute({ ...args, notification: notification });
    },
});

const moveOrgUnitCmd = command({
    name: "move-to-org-unit",
    description: "Move events to another organisation unit for event programs",
    args: {
        url: getApiUrlOption(),
        programIds: option({
            type: optional(StringsSeparatedByCommas),
            long: "programs-ids",
            description: "List of program (comma-separated)",
        }),
        fromOrgUnitId: option({
            type: string,
            long: "from-orgunit-id",
            description: "Organisation Unit source ID",
        }),
        toOrgUnitId: option({
            type: string,
            long: "to-orgunit-id",
            description: "Organisation Unit destination ID",
        }),
        post: flag({
            long: "post",
            description: "Post trackendEntities/events updated from the program rules execution",
        }),
    },
    handler: async args => {
        const api = getD2Api(args.url);
        const programEventsRepository = new ProgramEventsD2Repository(api);

        await new MoveEventsToOrgUnitUseCase(programEventsRepository).execute(args);
        if (!args.post) logger.info(`Add --post to update events`);
    },
});

const updateEventsDataValues = command({
    name: "Update events",
    description: "Update events that meet a condition",
    args: {
        url: getApiUrlOption(),
        eventIdsArray: option({
            type: optional(StringsSeparatedByCommas),
            long: "event-ids",
            description: "event id's separated by commas (mutually exclusive with --events-csv)",
        }),
        eventsCsvPath: option({
            type: optional(string),
            long: "events-csv",
            description: "Path to CSV file containing event IDs (mutually exclusive with --event-ids)",
        }),
        rootOrgUnit: option({
            type: string,
            long: "root-org-unit",
            description: "root organisation unit id",
        }),
        dataElementId: option({
            type: string,
            long: "data-element-id",
            description: "Data element id",
        }),
        condition: option({
            type: string,
            long: "condition",
            description: "Value which will be validated against the data element value",
        }),
        newValue: option({
            type: string,
            long: "new-value",
            description: "New value for the data element",
        }),
        reportPath: option({
            type: string,
            long: "report-path",
            description: "Path for the CSV report",
            defaultValue: () => "",
        }),
        post: flag({
            long: "post",
            description: "Save changes",
            defaultValue: () => false,
        }),
    },
    handler: async args => {
        try {
            if (args.eventIdsArray && args.eventsCsvPath) {
                throw new Error("Cannot use both --event-ids and --events-csv at the same time");
            }

            let eventIds: Id[] = [];
            if (args.eventIdsArray) {
                eventIds = args.eventIdsArray;
            } else if (args.eventsCsvPath) {
                eventIds = await readEventsFile(args.eventsCsvPath);
            } else {
                throw new Error("Either --event-ids or --events-csv must be provided");
            }

            const api = getD2Api(args.url);
            const programEventsRepository = new ProgramEventsD2Repository(api);
            const eventExportSpreadsheetRepository = new EventExportSpreadsheetRepository();
            const result = await new UpdateEventDataValueUseCase(
                new TerminalLogger(),
                programEventsRepository,
                eventExportSpreadsheetRepository
            ).execute({ ...args, eventIds });

            logger.info(`Result: ${JSON.stringify(result, null, 2)}`);

            if (!args.post) {
                logger.info(`Add --post to save changes`);
            }

            if (!args.reportPath) {
                logger.info(`Add --report-path to generate a csv report`);
            }
        } catch (error) {
            console.error((error as Error).message);
            process.exit(1);
        }
    },
});

const recodeBooleanDataValues = command({
    name: "recode-boolean-data-values",
    description: "Recode boolean data values to a ternary (Yes/No/NA) option set",
    args: {
        ...getApiUrlOptions(),
        programId: option({
            type: string,
            long: "program-id",
            description: "Program ID to recode",
        }),
        ternaryOptionSetId: option({
            type: string,
            long: "ternary-optionset-id",
            description: "ID of the ternary option set (Yes/No/NA) to recode",
        }),
        post: flag({
            long: "post",
            description: "Fix events",
            defaultValue: () => false,
        }),
    },
    handler: async args => {
        const api = getD2ApiFromArgs(args);
        const programsRepository = new ProgramsD2Repository(api);
        return new RecodeBooleanDataValuesInEventsUseCase(api, programsRepository).execute(args);
    },
});

async function readEventsFile(csvPath: string): Promise<Id[]> {
    if (!fs.existsSync(csvPath) || !fs.statSync(csvPath).isFile()) {
        throw new Error(`Can't find file: ${csvPath}`);
    }

    return new Promise((resolve, reject) => {
        const eventIds: Id[] = [];

        fs.createReadStream(csvPath, "utf8")
            .pipe(new CsvReadableStream({ asObject: true, trim: true }))
            .on("data", rawRow => {
                const row = rawRow as unknown as Ref;
                if (row.id) {
                    eventIds.push(row.id);
                }
            })
            .on("error", msg => {
                return reject(msg);
            })
            .on("end", () => {
                if (eventIds.length === 0) {
                    return reject(new Error("No event IDs found to process"));
                }
                return resolve(eventIds);
            });
    });
}
