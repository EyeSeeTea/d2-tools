import "json5/lib/register";
import { command, subcommands, option, string } from "cmd-ts";

import { getD2Api } from "scripts/common";
import { RunUserMonitoringUserRolesUseCase } from "domain/usecases/RunUserMonitoringUserRolesUseCase";
import { RunUserMonitoringUserGroupsUseCase } from "domain/usecases/RunUserMonitoringUserGroupsUseCase";
import log from "utils/log";
import { D2ExternalConfigRepository } from "data/D2ExternalConfigRepository";
import { GetUserMonitoringConfigUseCase } from "domain/config/usecases/GetUserMonitoringConfigUseCase";
import { UserMonitoringReportD2Repository } from "data/UserMonitoringReportD2Repository";
import { UserMonitoringD2Repository } from "data/UserMonitoringD2Repository";
import { AuthOptions } from "domain/entities/UserMonitoring";
import { UserGroupsMonitorRepository } from "data/UserGroupsMonitorRepository";
import { RunUserMonitoringReportUseCase } from "domain/usecases/RunUserMonitoringReportUseCase";
import { RunReportUsersWithout2FA } from "domain/usecases/RunReportUsersWithout2FA";
import { UserMonitoringMetadataD2Repository } from "data/UserMonitoringMetadataD2Repository";

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
        const usersRepository = new UserMonitoringD2Repository(api);
        const usersMonitoringMetadataRepository = new UserMonitoringMetadataD2Repository(
            api,
            usersRepository
        );
        const externalConfigRepository = new D2ExternalConfigRepository(api);
        const userMonitoringReportRepository = new UserMonitoringReportD2Repository(api);
        log.debug(`Get config: ${auth.apiurl}`);

        const config = await new GetUserMonitoringConfigUseCase(externalConfigRepository).execute();

        log.info(`Run user Role monitoring`);
        const response = await new RunReportUsersWithout2FA(
            usersMonitoringMetadataRepository,
            usersRepository,
            userMonitoringReportRepository
        ).execute(config);

        config.userGroupsResponse = response;
        log.info(`Save monitoring results`);
        new RunUserMonitoringReportUseCase(
            usersMonitoringMetadataRepository,
            userMonitoringReportRepository
        ).execute(config);
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
        const usersRepository = new UserMonitoringD2Repository(api);
        const userGroupsRepository = new UserGroupsMonitorRepository(api);
        const usersMonitoringMetadataRepository = new UserMonitoringMetadataD2Repository(
            api,
            usersRepository
        );
        const externalConfigRepository = new D2ExternalConfigRepository(api);
        const userMonitoringReportRepository = new UserMonitoringReportD2Repository(api);
        log.debug(`Get config: ${auth.apiurl}`);

        const config = await new GetUserMonitoringConfigUseCase(externalConfigRepository).execute();

        log.info(`Run user Group monitoring`);
        const userGroupResponse = await new RunUserMonitoringUserGroupsUseCase(
            usersMonitoringMetadataRepository,
            userGroupsRepository,
            usersRepository
        ).execute(config);

        config.userGroupsResponse = userGroupResponse;
        log.info(`Run user Role monitoring`);
        const userRoleResponse = await new RunUserMonitoringUserRolesUseCase(
            usersRepository,
            usersMonitoringMetadataRepository
        ).execute(config);

        config.userRolesResponse = userRoleResponse;
        log.info(`Save monitoring results`);
        new RunUserMonitoringReportUseCase(
            usersMonitoringMetadataRepository,
            userMonitoringReportRepository
        ).execute(config);
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
