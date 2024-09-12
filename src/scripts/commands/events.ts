import _ from "lodash";
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
import { UpdateEventDataValueUseCase } from "domain/usecases/UpdateEventDataValueUseCase";
import { EventExportSpreadsheetRepository } from "data/EventExportSpreadsheetRepository";
import { D2Api } from "types/d2-api";
import { Id } from "domain/entities/Base";
import { promiseMap } from "data/dhis2-utils";
import { DetectExternalOrgUnitUseCase } from "domain/usecases/ProcessEventsOutsideEnrollmentOrgUnitUseCase";
import { ProgramsD2Repository } from "data/ProgramsD2Repository";
import { RecodeBooleanDataValuesInEventsUseCase } from "domain/usecases/RecodeBooleanDataValuesInEventsUseCase";

export function getCommand() {
    return subcommands({
        name: "events",
        cmds: {
            "move-to-org-unit": moveOrgUnitCmd,
            "update-events": updateEventsDataValues,
            "detect-external-orgunits": detectExternalOrgUnitCmd,
            "recode-boolean-data-values": recodeBooleanDataValues,
        },
    });
}

const detectExternalOrgUnitCmd = command({
    name: "detect-external-orgunits",
    description: "Detect external organisation units",
    args: {
        ...getApiUrlOptions(),
        post: flag({
            long: "post",
            description: "Fix events",
            defaultValue: () => false,
        }),
    },
    handler: async args => {
        const api = getD2ApiFromArgs(args);
        const programsRepository = new ProgramsD2Repository(api);
        return new DetectExternalOrgUnitUseCase(api, programsRepository).execute(args);
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
    description: "Update events which met the condition",
    args: {
        url: getApiUrlOption(),
        eventIds: option({
            type: StringsSeparatedByCommas,
            long: "event-ids",
            description: "event id's separated by commas",
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
        csvPath: option({
            type: string,
            long: "csv-path",
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
        const api = getD2Api(args.url);
        const programEventsRepository = new ProgramEventsD2Repository(api);
        const eventExportSpreadsheetRepository = new EventExportSpreadsheetRepository();
        const result = await new UpdateEventDataValueUseCase(
            programEventsRepository,
            eventExportSpreadsheetRepository
        ).execute(args);

        logger.info(`Result: ${JSON.stringify(result, null, 2)}`);

        if (!args.post) {
            logger.info(`Add --post to save changes`);
        }

        if (!args.csvPath) {
            logger.info(`Add --csv-path to generate a csv report`);
        }
    },
});

const recodeBooleanDataValues = command({
    name: "recode-boolean-data-values",
    description: "Recode boolean data values",
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
        const eventsRepository = new ProgramEventsD2Repository(api);
        const programsRepository = new ProgramsD2Repository(api);
        return new RecodeBooleanDataValuesInEventsUseCase(api, programsRepository, eventsRepository).execute(
            args
        );
    },
});
