import _, { uniqueId } from "lodash";
import { command, subcommands, option, optional, flag, boolean, string } from "cmd-ts";

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
                "List of template-groups key-value (comma-separated, template1-group1,template2-group2...).",
        }),
        exclude_roles: option({
            type: optional(StringsSeparatedByCommas),
            long: "exclude-roles",
            description:
                "List of roles id to be excluded, for example due have empty authorities (comma-separated, id1,id2...).",
        }),
        exclude_users: option({
            type: optional(StringsSeparatedByCommas),
            long: "exclude-users",
            description:
                "List of users id to be excluded, for example the user templates (added by default from template-group) (comma-separated, id1,id2...).",
        }),
        pushReport: flag({
            type: boolean,
            long: "push-report",
            short: "p",
            description: "Push report to dhis2 event program.",
        }),
        pushProgramId: option({
            type: string,
            long: "push-program-id",
            short: "pid",
            description:
                "Push user program id org unit  to report result in dhis2 server, the dataelements must have the codes: ADMIN_invalid_Users_1_Events, ADMIN_invalid_Roles_Users_2_Events, ADMIN_invalid_Users_file_3_Events, ADMIN_invalid_Roles_Users_file_4_Events",
        }),
        minimalRole: option({
            type: string,
            long: "min-role",
            short: "mr",
            description:
                "When the user does not have user groups, all their roles must be deleted but the users needs at least have one role, this is the role with less permissions for the user",
        }),
    },
    handler: async args => {
        const api = getD2Api(args.url);
        const templates = args.template_group;
        const usersRepository = new UsersD2Repository(api);
        const UsersOptions: TemplateGroup[] = templates!.map(item => {
            const templateId = item.split("-")[0];
            const groupId = item.split("-")[1];
            return {
                templateId: templateId ?? "-",
                groupId: groupId ?? "-",
                validRolesByAuthority: [],
                invalidRolesByAuthority: [],
                validRolesById: [],
                invalidRolesById: [],
            };
        });
        const exclude_roles: string[] = args.exclude_roles ?? [];
        const exclude_users: string[] = args.exclude_roles ?? [];
        const push_report: boolean = args.pushReport ?? false;
        const push_program_id: string = args.pushProgramId ?? "tBI5HRoOMUz";
        const minimal_role: string = args.minimalRole ?? "J44B9Xy7kH6";
        UsersOptions?.map(item => {
            exclude_users.push(item.templateId);
        });

        new RunUserPermissionsUseCase(usersRepository).execute({
            templates: UsersOptions,
            excludedRoles: exclude_roles,
            excludedUsers: exclude_users,
            pushReport: push_report,
            pushProgramId: push_program_id,
            minimalRoleId: minimal_role,
        });
    },
});
