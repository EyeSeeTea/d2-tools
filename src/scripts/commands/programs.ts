import _ from "lodash";
import { command, string, subcommands, option, positional, optional, flag } from "cmd-ts";

import {
    choiceOf,
    getApiUrlOption,
    getApiUrlOptions,
    getD2Api,
    getD2ApiFromArgs,
    StringsSeparatedByCommas,
} from "scripts/common";
import { ProgramsD2Repository } from "data/ProgramsD2Repository";
import { ExportProgramsUseCase } from "domain/usecases/ExportProgramsUseCase";
import { ImportProgramsUseCase } from "domain/usecases/ImportProgramsUseCase";
import { RunProgramRulesUseCase } from "domain/usecases/RunProgramRulesUseCase";
import { GetDuplicatedEventsUseCase, orgUnitModes } from "domain/usecases/GetDuplicatedEventsUseCase";
import { ProgramEventsD2Repository } from "data/ProgramEventsD2Repository";
import { ProgramEventsExportCsvRepository } from "data/ProgramEventsExportCsvRepository";
import { DeleteProgramDataValuesUseCase } from "domain/usecases/DeleteProgramDataValuesUseCase";

export function getCommand() {
    return subcommands({
        name: "programs",
        cmds: {
            export: exportCmd,
            import: importCmd,
            "run-program-rules": runProgramRulesCmd,
            "get-duplicated-events": getDuplicatedEventsCmd,
            "delete-data-values": deleteDataValuesCmd,
        },
    });
}

const programIdsOptions = option({
    type: StringsSeparatedByCommas,
    long: "programs-ids",
    description: "List of program (comma-separated)",
});

const exportCmd = command({
    name: "export",
    description: "Export program metadata and data (events, enrollments, TEIs)",
    args: {
        url: getApiUrlOption(),
        programIds: programIdsOptions,
        orgUnitIds: option({
            type: optional(StringsSeparatedByCommas),
            long: "orgunits-ids",
            description: "List of organisation units (comma-separated)",
        }),
        outputFile: positional({
            type: string,
            description: "Output file (JSON)",
        }),
    },
    handler: async args => {
        if (_.isEmpty(args.programIds)) throw new Error("Missing program IDs");
        const api = getD2Api(args.url);
        const programsRepository = new ProgramsD2Repository(api);

        new ExportProgramsUseCase(programsRepository).execute({
            ...args,
            ids: args.programIds,
        });
    },
});

const importCmd = command({
    name: "import",
    description: "Import program metadata and data (events, enrollments, TEIs)",
    args: {
        url: getApiUrlOption(),
        inputFile: positional({
            type: string,
            description: "Input file (JSON)",
        }),
    },
    handler: async args => {
        const api = getD2Api(args.url);
        const programsRepository = new ProgramsD2Repository(api);
        new ImportProgramsUseCase(programsRepository).execute({
            inputFile: args.inputFile,
        });
    },
});

const runProgramRulesCmd = command({
    name: "run-program-rules",
    description: "Run program rules for programs",
    args: {
        url: getApiUrlOption(),
        programIds: programIdsOptions,
        programRulesIds: option({
            type: optional(StringsSeparatedByCommas),
            long: "program-rules-ids",
            description: "List of program rules to use (comma-separated)",
        }),
        orgUnitsIds: option({
            type: optional(StringsSeparatedByCommas),
            long: "org-units-ids",
            description: "List of organisation units to filter (comma-separated)",
        }),
        teiId: option({
            type: optional(string),
            long: "tei-id",
            description: "TEI id",
        }),
        startDate: option({
            type: optional(string),
            long: "start-date",
            description: "Start date for events",
        }),
        endDate: option({
            type: optional(string),
            long: "end-date",
            description: "End date for events",
        }),
        post: flag({
            long: "post",
            description: "Post trackendEntities/events updated from the program rules execution",
        }),
        reportPath: option({
            type: optional(string),
            long: "save-report",
            description: "Save CSV report with the program rules",
        }),
        payloadPath: option({
            type: optional(string),
            long: "save-payload",
            description: "Save JSON payload with event/TEIs",
        }),
    },
    handler: async args => {
        const api = getD2Api(args.url);
        const programsRepository = new ProgramsD2Repository(api);

        new RunProgramRulesUseCase(programsRepository).execute(args);
    },
});

const getDuplicatedEventsCmd = command({
    name: "Duplicated events",
    description: "Detect and delete duplicated events for event/tracker programs",
    args: {
        ...getApiUrlOptions(),
        programIds: programIdsOptions,
        orgUnitsIds: option({
            type: StringsSeparatedByCommas,
            long: "org-units-ids",
            description: "List of organisation units to filter (comma-separated)",
        }),
        orgUnitMode: option({
            type: optional(choiceOf(orgUnitModes)),
            long: "org-unit-mode",
            description: `Orgunit mode: ${orgUnitModes.join(", ")}`,
        }),
        startDate: option({
            type: optional(string),
            long: "start-date",
            description: "Start date for events",
        }),
        endDate: option({
            type: optional(string),
            long: "end-date",
            description: "End date for events",
        }),
        checkDataElementsIds: option({
            type: optional(StringsSeparatedByCommas),
            long: "check-dataelements-ids",
            description: "List of data elements to check on event data values (comma-separated)",
        }),
        ignoreDataElementsIds: option({
            type: optional(StringsSeparatedByCommas),
            long: "ignore-dataelements-ids",
            description: "List of data elements to ignore on event data values (comma-separated)",
        }),
        saveReport: option({
            type: string,
            long: "save-report",
            description: "Save report to CSV file",
        }),
        post: flag({
            long: "post",
            description: "Post events",
        }),
    },
    handler: async args => {
        const api = getD2ApiFromArgs(args);
        const eventsRepository = new ProgramEventsD2Repository(api);
        const eventsExportRepository = new ProgramEventsExportCsvRepository();
        const options = _.omit(args, ["url"]);

        new GetDuplicatedEventsUseCase(eventsRepository, eventsExportRepository).execute(options);
    },
});

const orgUnitsIdsArg = option({
    type: StringsSeparatedByCommas,
    long: "org-units-ids",
    description: "List of organisation units (comma-separated)",
});

const orgUnitModeArg = option({
    type: optional(choiceOf(orgUnitModes)),
    long: "org-unit-mode",
    description: `Orgunit mode: ${orgUnitModes.join(", ")}`,
});

const startDateArg = option({
    type: optional(string),
    long: "start-date",
    description: "Start date",
});

const endDateArg = option({
    type: optional(string),
    long: "end-date",
    description: "End date",
});

const dataElementIdsInclude = option({
    type: optional(StringsSeparatedByCommas),
    long: "include-data-elements-ids",
    description: "List of data elements to include (comma-separated)",
});

const dataElementIdsExclude = option({
    type: optional(StringsSeparatedByCommas),
    long: "exclude-data-elements-ids",
    description: "List of data elements to include (comma-separated)",
});

const deleteDataValuesCmd = command({
    name: "Duplicated events",
    description: "Detect and delete duplicated events for event/tracker programs",
    args: {
        ...getApiUrlOptions(),
        programIds: programIdsOptions,
        orgUnitsIds: orgUnitsIdsArg,
        orgUnitMode: orgUnitModeArg,
        startDate: startDateArg,
        endDate: endDateArg,
        dataElementsIdsInclude: dataElementIdsInclude,
        dataElementsIdsExclude: dataElementIdsExclude,
        saveBackup: option({
            type: optional(string),
            long: "save-backup",
            description: "Save backup to JSON file",
        }),
        savePayload: option({
            type: optional(string),
            long: "save-payload",
            description: "Save payload to JSON file",
        }),
        post: flag({
            long: "post",
            description: "Delete data values",
        }),
    },
    handler: async args => {
        const api = getD2ApiFromArgs(args);
        const eventsRepository = new ProgramEventsD2Repository(api);
        const options = _.omit(args, ["url"]);

        new DeleteProgramDataValuesUseCase(eventsRepository).execute(options);
    },
});
