import _ from "lodash";
import { command, string, subcommands, option, optional } from "cmd-ts";

import { getApiUrlOption, getD2Api, StringsSeparatedByCommas } from "scripts/common";
import { ProgramsD2Repository } from "data/ProgramsD2Repository";
import { RunProgramRulesUseCase } from "domain/usecases/RunProgramRulesUseCase";
import { RunUserPermissionsUseCase } from "domain/usecases/RunUserPermissionsUseCase";
import { UsersD2Repository } from "data/UsersD2Repository";
import { TemplateGroup, UsersOptions } from "domain/repositories/UsersRepository";

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
    },
    handler: async args => {
        const api = getD2Api(args.url);
        const templates = args.template_group
        const programsRepository = new UsersD2Repository(api);
        const UsersOptions:TemplateGroup[] = templates!.map( item =>{ 
            const templateId = item.split("-")[0]
            const groupId = item.split("-")[1]
            return {templateId:templateId??"-", groupId:groupId??"-"} 
        }
            )
        new RunUserPermissionsUseCase(programsRepository).execute({templates: UsersOptions});
    },
});
