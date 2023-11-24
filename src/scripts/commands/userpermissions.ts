import _, { uniqueId } from "lodash";
import "json5/lib/register";
import { command, subcommands, option, optional, flag, boolean, string } from "cmd-ts";

import { getApiUrlOption, getD2Api, StringsSeparatedByCommas } from "scripts/common";
import { RunUserPermissionsUseCase } from "domain/usecases/RunUserPermissionsUseCase";
import { UsersD2Repository } from "data/UsersD2Repository";
import {
    Item,
    RolesByGroup,
    RolesByRoles,
    RolesByUser,
    TemplateGroup,
    UsersOptions,
} from "domain/repositories/UsersRepository";
import log from "utils/log";

export function getCommand() {
    return subcommands({
        name: "users-permissions",
        cmds: {
            "run-users-permissions": runUsersPermisionsCmd,
        },
    });
}

const runUsersPermisionsCmd = command({
    name: "run-users-permissions",
    description: "Run user permissions, a --config-file must be provided",
    args: {
        config_file: option({
            type: string,
            long: "config-file",
            description: "Config file",
        }),
    },
    handler: async args => {
        const userOptions = getOptions(args.config_file);
        log.info(`Get metadata: All users IDS: ${userOptions.apiurl}`);
        const api = getD2Api(userOptions.apiurl);
        const usersRepository = new UsersD2Repository(api);

        new RunUserPermissionsUseCase(usersRepository).execute(userOptions);
    },
});

function getOptions(config_file: string): UsersOptions {
    const fs = require("fs");
    const configJSON = JSON.parse(fs.readFileSync("./" + config_file, "utf8"));

    const apiurl: string =
        configJSON["URL"]["prefix"] +
        configJSON["URL"]["username"] +
        ":" +
        configJSON["URL"]["password"] +
        "@" +
        configJSON["URL"]["server"];
    const UsersOptions: TemplateGroup[] = configJSON["TEMPLATE_GROUPS"]!.map((item: any) => {
        const templateId = item["template"];
        const groupId = item["group"];
        return {
            templateId: templateId ?? "-",
            groupId: groupId ?? "-",
            validRolesByAuthority: [],
            invalidRolesByAuthority: [],
            validRolesById: [],
            invalidRolesById: [],
        };
    });
    const exclude_roles: Item[] = configJSON["EXCLUDE_ROLES"] ?? [];
    const exclude_users: Item[] = configJSON["EXCLUDE_USERS"] ?? [];
    const exclude_roles_by_user: RolesByUser[] = configJSON["EXCLUDE_ROLES_BY_USERS"] ?? [];
    const exclude_roles_by_group: RolesByGroup[] = configJSON["EXCLUDE_ROLES_BY_GROUPS"] ?? [];
    const exclude_roles_by_role: RolesByRoles[] = configJSON["EXCLUDE_ROLES_BY_ROLE"] ?? [];
    const push_report: boolean = configJSON["PUSH_REPORT"] ?? false;
    const push_program_id: Item = configJSON["PUSH_PROGRAM_ID"] ?? new Error(`push program id not found`);
    const minimal_group: Item = configJSON["MINIMAL_GROUP"] ?? new Error(`minimal group not found`);
    const minimal_role: Item = configJSON["MINIMAL_ROLE"] ?? new Error(`minimal role not found`);

    return {
        templates: UsersOptions,
        excludedRoles: exclude_roles,
        excludedUsers: exclude_users,
        excludedRolesByUser: exclude_roles_by_user,
        excludedRolesByGroup: exclude_roles_by_group,
        excludedRolesByRole: exclude_roles_by_role,
        pushReport: push_report,
        pushProgramId: push_program_id,
        minimalGroupId: minimal_group,
        minimalRoleId: minimal_role,
        apiurl: apiurl,
    };
}
