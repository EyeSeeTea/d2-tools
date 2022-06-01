import _ from "lodash";
import { command, string, subcommands, option, positional } from "cmd-ts";

import { getApiUrlOption, getD2Api, StringsSeparatedByCommas } from "scripts/common";
import { ProgramsD2Repository } from "data/ProgramsD2Repository";
import { ExportProgramsUseCase } from "domain/usecases/ExportProgramsUseCase";
import { ImportProgramsUseCase } from "domain/usecases/ImportProgramsUseCase";

export function getCommand() {
    return subcommands({
        name: "programs",
        cmds: { export: exportCmd, import: importCmd },
    });
}

const exportCmd = command({
    name: "export",
    description: "Export program metadata and data (events, enrollments, TEIs)",
    args: {
        url: getApiUrlOption(),
        programIds: option({
            type: StringsSeparatedByCommas,
            long: "ids",
            description: "List of program ID1,ID2[,IDN] to export (comma-separated)",
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