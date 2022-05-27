import _ from "lodash";
import { command, string, restPositionals, subcommands, option } from "cmd-ts";

import { getApiUrlOption, getD2Api } from "scripts/common";
import { ProgramsD2Repository } from "data/ProgramsD2Repository";
import { ExportProgramsUseCase } from "domain/usecases/ExportProgramsUseCase";

export function getCommand() {
    const exportCmd = command({
        name: "export",
        description: "Export program metadata and data (events, enrollments, TEIs)",
        args: {
            url: getApiUrlOption(),
            outputFile: option({
                type: string,
                short: "-f",
                long: "output-file",
                description: "Output file (JSON)",
            }),
            programIds: restPositionals({
                type: string,
                displayName: "PROGRAM_ID",
                description: "List of program IDs to export",
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

    return subcommands({
        name: "programs",
        cmds: { export: exportCmd },
    });
}
