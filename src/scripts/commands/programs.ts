import _ from "lodash";
import { command, string, subcommands, option, positional, optional, flag } from "cmd-ts";

import { getApiUrlOption, getD2Api, StringsSeparatedByCommas } from "scripts/common";
import { ProgramsD2Repository } from "data/ProgramsD2Repository";
import { ExportProgramsUseCase } from "domain/usecases/ExportProgramsUseCase";
import { ImportProgramsUseCase } from "domain/usecases/ImportProgramsUseCase";
import { RunProgramRulesUseCase } from "domain/usecases/RunProgramRulesUseCase";

export function getCommand() {
    return subcommands({
        name: "programs",
        cmds: { export: exportCmd, import: importCmd, "run-program-rules": runProgramRulesCmd },
    });
}

const programIdsOptions = option({
    type: StringsSeparatedByCommas,
    long: "programs-ids",
    description: "List of program ID1,ID2[,IDN] (comma-separated)",
});

const exportCmd = command({
    name: "export",
    description: "Export program metadata and data (events, enrollments, TEIs)",
    args: {
        url: getApiUrlOption(),
        programIds: programIdsOptions,
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
            ids: args.programIds,
            outputFile: args.outputFile,
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
            description: "List of program rules ID1,ID2[,IDN] to use (comma-separated)",
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
    },
    handler: async args => {
        const api = getD2Api(args.url);
        const programsRepository = new ProgramsD2Repository(api);

        new RunProgramRulesUseCase(programsRepository).execute(args);
    },
});
