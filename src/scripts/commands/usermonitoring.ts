import "json5/lib/register";
import { command, subcommands, option, string } from "cmd-ts";

import { getD2Api } from "scripts/common";
import log from "utils/log";
import { UserMonitoringUserD2Repository } from "data/user-monitoring/common/UserMonitoringUserD2Repository";

import { RunReportUsersWithout2FAUseCase } from "domain/usecases/user-monitoring/two-factor-monitoring/RunReportUsersWithout2FAUseCase";

import { TwoFactorConfigD2Repository } from "data/user-monitoring/two-factor-monitoring/TwoFactorConfigD2Repository";
import { PermissionFixerConfigD2Repository } from "data/user-monitoring/permission-fixer/PermissionFixerConfigD2Repository";
import { PermissionFixerTemplateD2Repository } from "data/user-monitoring/permission-fixer/PermissionFixerTemplateD2Repository";
import { PermissionFixerReportD2Repository } from "data/user-monitoring/permission-fixer/PermissionFixerReportD2Repository";
import { TwoFactorUsersReportD2Repository } from "data/user-monitoring/two-factor-monitoring/TwoFactorUsersReportD2Repository";
import { UserGroupD2Repository } from "data/user-monitoring/permission-fixer/PermissionFixerUserGroupD2Repository";
import { RunUserPermissionUseCase } from "domain/usecases/user-monitoring/permission-fixer/RunUserPermissionUseCase";
import { UserMonitoringProgramD2Repository } from "data/user-monitoring/common/UserMonitoringProgramD2Repository";

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
        const usersRepository = new UserMonitoringUserD2Repository(api);
        const externalConfigRepository = new TwoFactorConfigD2Repository(api);
        const userMonitoringReportRepository = new TwoFactorUsersReportD2Repository(api);
        const programRepository = new UserMonitoringProgramD2Repository(api);
        log.info(`Run Report users without 2FA`);
        await new RunReportUsersWithout2FAUseCase(
            usersRepository,
            userMonitoringReportRepository,
            externalConfigRepository,
            programRepository
        ).execute();
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
        const auth = getAuthFromFile(args.config_file);
        const api = getD2Api(auth.apiurl);
        const usersRepository = new UserMonitoringUserD2Repository(api);
        const userGroupsRepository = new UserGroupD2Repository(api);
        const usersTemplateRepository = new PermissionFixerTemplateD2Repository(api);
        const externalConfigRepository = new PermissionFixerConfigD2Repository(api);
        const userMonitoringReportRepository = new PermissionFixerReportD2Repository(api);
        const programRepository = new UserMonitoringProgramD2Repository(api);
        log.info(`Run User permissions fixer`);
        await new RunUserPermissionUseCase(
            externalConfigRepository,
            userMonitoringReportRepository,
            usersTemplateRepository,
            userGroupsRepository,
            usersRepository,
            programRepository
        ).execute();
    },
});

function getAuthFromFile(config_file: string): UserMonitoringAuth {
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

export type UserMonitoringAuth = { apiurl: string };
