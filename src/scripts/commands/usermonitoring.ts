import "json5/lib/register";
import { command, subcommands, option, string } from "cmd-ts";

import { getD2Api } from "scripts/common";
import log from "utils/log";
import { UserD2Repository } from "data/user-monitoring/two-factor-monitoring/UserD2Repository";

import { AuthOptions } from "domain/entities/user-monitoring/common/AuthOptions";

import { RunReportUsersWithout2FA } from "domain/usecases/user-monitoring/two-factor-monitoring/RunReportUsersWithout2FA";

import { AuthOptions as AuthPermisisonOptions } from "domain/entities/user-monitoring/common/AuthOptions";

import { RunUserPermissionUserRolesUseCase as RunUserPermissionUserRoleUsecase } from "domain/usecases/user-monitoring/permission-fixer/RunUserPermissionUserRolesUseCase";
import { RunUserPermissionUserGroupsUseCase as RunUserPermissionUserGroupUseCase } from "domain/usecases/user-monitoring/permission-fixer/RunUserPermissionUserGroupsUseCase";
import { RunUserPermissionReportUseCase as RunUserPermissionUserReportUseCase } from "domain/usecases/user-monitoring/permission-fixer/RunUserPermissionReportUseCase";
import { GetPermissionFixerConfigUseCase } from "domain/usecases/user-monitoring/permission-fixer/GetPermissionFixerConfigUseCase";
import { GetTwoFactorConfigUseCase } from "domain/usecases/user-monitoring/two-factor-monitoring/GetTwoFactorConfigUseCase";
import { TwoFactorD2ConfigRepository } from "data/user-monitoring/two-factor-monitoring/TwoFactorD2ConfigRepository";
import { D2PermissionFixerConfigRepository } from "data/user-monitoring/permission-fixer/D2PermissionFixerConfigRepository";
import { PermissionFixerTemplateD2Repository } from "data/user-monitoring/permission-fixer/PermissionFixerTemplateD2Repository";
import { PermissionFixerReportD2Repository } from "data/user-monitoring/permission-fixer/PermissionFixerReportD2Repository";
import { TwoFactorUsersReportD2Repository } from "data/user-monitoring/two-factor-monitoring/TwoFactorUsersReportD2Repository";
import { UserGroupD2Repository } from "data/user-monitoring/permission-fixer/UserGroupD2Repository";

export function getCommand() {
    return subcommands({
        name: "users-monitoring",
        cmds: {
            "run-permissions-fixer": runUsersMonitoringCmd,
            "run-2fa-reporter": run2FAReporterCmd,
        },
    });
}

const run2FAReporterCmd = command({
    name: "run-2fa-reporter",
    description:
        "Run user 2factor reporter, a --config-file must be provided (usersmonitoring run-2fa-reporter --config-file config.json)",
    args: {
        config_file: option({
            type: string,
            long: "config-file",
            description: "Config file",
        }),
    },

    handler: async args => {
        const auth = getAuthFromFile(args.config_file);
        const api = getD2Api(auth.apiurl);
        const usersRepository = new UserD2Repository(api);
        const externalConfigRepository = new TwoFactorD2ConfigRepository(api);
        const userMonitoringReportRepository = new TwoFactorUsersReportD2Repository(api);
        log.debug(`Get config: ${auth.apiurl}`);

        const config = await new GetTwoFactorConfigUseCase(externalConfigRepository).execute();

        log.info(`Run user Role monitoring`);
        const response = await new RunReportUsersWithout2FA(
            usersRepository,
            userMonitoringReportRepository
        ).execute(config);

        config.userGroupsResponse = response;
    },
});

const runUsersMonitoringCmd = command({
    name: "run-permissions-fixer",
    description:
        "Run user monitoring, a --config-file must be provided (usersmonitoring run-permissions-fixer --config-file config.json)",
    args: {
        config_file: option({
            type: string,
            long: "config-file",
            description: "Config file",
        }),
    },

    handler: async args => {
        const auth = getAuthPermissionFromFile(args.config_file);
        const api = getD2Api(auth.apiurl);
        const usersRepository = new UserD2Repository(api);
        const userGroupsRepository = new UserGroupD2Repository(api);
        const usersTemplateRepository = new PermissionFixerTemplateD2Repository(api, usersRepository);
        const externalConfigRepository = new D2PermissionFixerConfigRepository(api);
        const userMonitoringReportRepository = new PermissionFixerReportD2Repository(api);
        log.debug(`Get config: ${auth.apiurl}`);

        const config = await new GetPermissionFixerConfigUseCase(externalConfigRepository).execute();

        log.info(`Run user Group monitoring`);
        const userGroupResponse = await new RunUserPermissionUserGroupUseCase(
            usersTemplateRepository,
            userGroupsRepository,
            usersRepository
        ).execute(config);

        config.userGroupsResponse = userGroupResponse;
        log.info(`Run user Role monitoring`);
        const userRoleResponse = await new RunUserPermissionUserRoleUsecase(
            usersRepository,
            usersTemplateRepository
        ).execute(config);

        config.userRolesResponse = userRoleResponse;
        log.info(`Save user-monitoring user-permissions results`);
        new RunUserPermissionUserReportUseCase(userMonitoringReportRepository).execute(config);
    },
});

function getAuthFromFile(config_file: string): AuthOptions {
    const fs = require("fs");
    const configJSON = JSON.parse(fs.readFileSync("./" + config_file, "utf8"));
    const urlprefix = configJSON["URL"]["server"].split("//")[0] + "//";
    const urlserver = configJSON["URL"]["server"].split("//")[1];
    const apiurl: string =
        urlprefix + configJSON["URL"]["username"] + ":" + configJSON["URL"]["password"] + "@" + urlserver;

    return {
        apiurl: apiurl,
    };
}

function getAuthPermissionFromFile(config_file: string): AuthPermisisonOptions {
    const fs = require("fs");
    const configJSON = JSON.parse(fs.readFileSync("./" + config_file, "utf8"));
    const urlprefix = configJSON["URL"]["server"].split("//")[0] + "//";
    const urlserver = configJSON["URL"]["server"].split("//")[1];
    const apiurl: string =
        urlprefix + configJSON["URL"]["username"] + ":" + configJSON["URL"]["password"] + "@" + urlserver;

    return {
        apiurl: apiurl,
    };
}
