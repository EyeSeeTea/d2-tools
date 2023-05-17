import _, { uniqueId } from "lodash";
import "json5/lib/register";
import { command, subcommands, option, optional, flag, boolean, string } from "cmd-ts";

import { getApiUrlOption, getD2Api, StringsSeparatedByCommas } from "scripts/common";
import { RunUserPermissionsUseCase } from "domain/usecases/RunUserPermissionsUseCase";
import { UsersD2Repository } from "data/UsersD2Repository";
import { TemplateGroup, UsersOptions } from "domain/repositories/UsersRepository";


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
        config_file: option({
            type: string,
            long: "config-file",
            description: "Config file"
        })
    },
    handler: async args => {
        const api = getD2Api(args.url); 
        const usersRepository = new UsersD2Repository(api);
       

        new RunUserPermissionsUseCase(usersRepository).execute(
            getOptions(args.config_file));
    },
});

function getOptions(config_file: string):UsersOptions {
    const fs = require('fs');
    const configJSON = JSON.parse(fs.readFileSync('./' + config_file , 'utf8'));
    
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
    const exclude_roles: string[] = configJSON["EXCLUDE_ROLES"] ?? [];
    const exclude_users: string[] = configJSON["EXCLUDE_ROLES_USERS"] ?? [];
    const push_report: boolean = configJSON["PUSH_REPORT"] ?? false;
    const push_program_id: string = configJSON["PUSH_PROGRAM_ID"] ?? new Error(`push program id not found`);;
    const minimal_group: string = configJSON["MINIMAL_GROUP"]  ?? new Error(`minimal group not found`);;
    const minimal_role: string = configJSON["MINIMAL_ROLE"] ?? new Error(`minimal role not found`);;
    UsersOptions?.map(item => {
        exclude_users.push(item.templateId);
    });
    return {
        templates: UsersOptions,
        excludedRoles: exclude_roles,
        excludedUsers: exclude_users,
        pushReport: push_report,
        pushProgramId: push_program_id,
        minimalGroupId: minimal_group,
        minimalRoleId: minimal_role,
    }
}

