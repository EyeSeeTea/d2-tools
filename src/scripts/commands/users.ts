import _ from "lodash";
import { command, string, subcommands, option, optional } from "cmd-ts";

import { getApiUrlOption, getD2Api, StringsSeparatedByCommas } from "scripts/common";
import { ProgramsD2Repository } from "data/ProgramsD2Repository";
import { RunProgramRulesUseCase } from "domain/usecases/RunProgramRulesUseCase";

export function getCommand() {
    return subcommands({
        name: "users",
        cmds: {
            "user-permissions": runUsersPermisionCmd,
        },
    });
}

const runUsersPermisionCmd = command({
    name: "run-users-permissions",
    description: "Run user permissions",
    args: {
        url: getApiUrlOption(),
        template_group: option({
            type: optional(StringsSeparatedByCommas),
            long: "template-group",
            description:
                "List of template-groups key-value (comma-separated, template1-group1,template2-group2...)",
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
