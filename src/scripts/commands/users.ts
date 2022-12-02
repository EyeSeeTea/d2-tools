import _, { uniqueId } from "lodash";
import { command, subcommands, option, optional } from "cmd-ts";

import { getApiUrlOption, getD2Api, StringsSeparatedByCommas } from "scripts/common";
import { RunUserPermissionsUseCase } from "domain/usecases/RunUserPermissionsUseCase";
import { UsersD2Repository } from "data/UsersD2Repository";
import { TemplateGroup } from "domain/repositories/UsersRepository";

export function getCommand() {
    return subcommands({
        name: "users",
        cmds: {
            "run-users-permissions": runUsersPermisionsCmd,
        },
    });
}

const runUsersPermisionsCmd = command({
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
        const templates = args.template_group;
        const usersRepository = new UsersD2Repository(api);
        const UsersOptions: TemplateGroup[] = templates!.map(item => {
            const templateId = item.split("-")[0];
            const groupId = item.split("-")[1];
            return { templateId: templateId ?? "-", groupId: groupId ?? "-" };
        });
        new RunUserPermissionsUseCase(usersRepository).execute({ templates: UsersOptions });
    },
});
