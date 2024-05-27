import "json5/lib/register";
import { command, subcommands, option, string, boolean, flag } from "cmd-ts";

import { getD2Api } from "scripts/common";
import log from "utils/log";

import { RunTwoFactorReportUseCase } from "domain/usecases/user-monitoring/two-factor-monitoring/RunTwoFactorReportUseCase";

import { TwoFactorConfigD2Repository } from "data/user-monitoring/two-factor-monitoring/TwoFactorConfigD2Repository";
import { PermissionFixerConfigD2Repository } from "data/user-monitoring/permission-fixer/PermissionFixerConfigD2Repository";
import { PermissionFixerTemplateD2Repository } from "data/user-monitoring/permission-fixer/PermissionFixerTemplateD2Repository";
import { PermissionFixerReportD2Repository } from "data/user-monitoring/permission-fixer/PermissionFixerReportD2Repository";
import { TwoFactorReportD2Repository } from "data/user-monitoring/two-factor-monitoring/TwoFactorReportD2Repository";
import { PermissionFixerUserGroupD2Repository } from "data/user-monitoring/permission-fixer/PermissionFixerUserGroupD2Repository";
import { RunUserPermissionUseCase } from "domain/usecases/user-monitoring/permission-fixer/RunUserPermissionUseCase";
import { UserMonitoringProgramD2Repository } from "data/user-monitoring/common/UserMonitoringProgramD2Repository";
import { TwoFactorUserD2Repository } from "data/user-monitoring/two-factor-monitoring/TwoFactorUserD2Repository";
import { PermissionFixerUserD2Repository } from "data/user-monitoring/permission-fixer/PermissionFixerUserD2Repository";

import { AuthoritiesMonitoringConfigD2Repository } from "data/user-monitoring/authorities-monitoring/AuthoritiesMonitoringConfigD2Repository";
import { UserRolesD2Repository } from "data/user-monitoring/authorities-monitoring/UserRolesD2Repository";
import { MessageMSTeamsRepository } from "data/user-monitoring/authorities-monitoring/MessageMSTeamsRepository";
import { GetAuthoritiesMonitoringConfigUseCase } from "domain/usecases/user-monitoring/authorities-monitoring/GetAuthoritiesMonitoringConfigUseCase";
import { MonitorUsersByAuthorityUseCase } from "domain/usecases/user-monitoring/authorities-monitoring/MonitorUsersByAuthorityUseCase";
import { WebhookOptions } from "domain/entities/user-monitoring/common/WebhookOptions";

export function getCommand() {
    return subcommands({
        name: "users-monitoring",
        cmds: {
            "run-permissions-fixer": runUsersMonitoringCmd,
            "run-2fa-reporter": run2FAReporterCmd,
            "authorities-monitoring": authoritiesMonitoring,
        },
    });
}

const run2FAReporterCmd = command({
    name: "run-2fa-reporter",
    description:
        "Run user 2factor reporter, a --config-file must be provided (usermonitoring run-2fa-reporter --config-file config.json)",
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
        const usersRepository = new TwoFactorUserD2Repository(api);
        const externalConfigRepository = new TwoFactorConfigD2Repository(api);
        const userMonitoringReportRepository = new TwoFactorReportD2Repository(api);
        const programRepository = new UserMonitoringProgramD2Repository(api);
        log.info(`Run Report users without 2FA`);
        await new RunTwoFactorReportUseCase(
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
        "Run user monitoring, a --config-file must be provided (usermonitoring run-permissions-fixer --config-file config.json)",
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
        const usersRepository = new PermissionFixerUserD2Repository(api);
        const userGroupsRepository = new PermissionFixerUserGroupD2Repository(api);
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

const authoritiesMonitoring = command({
    name: "authorities-monitoring",
    description:
        "Run user authorities monitoring, a --config-file must be provided (usersmonitoring run-permissions-fixer --config-file config.json)",
    args: {
        config_file: option({
            type: string,
            long: "config-file",
            description: "Config file",
        }),
        setDataStore: flag({
            type: boolean,
            short: "s",
            long: "set-datastore",
            description:
                "Write users data to datastore, use in script setup. It assumes there is a monitoring config in d2-tools/user-monitoring",
        }),
    },

    handler: async args => {
        const auth = getAuthFromFile(args.config_file);
        const webhook = getWebhookConfFromFile(args.config_file);
        const api = getD2Api(auth.apiurl);
        const UserRolesRepository = new UserRolesD2Repository(api);
        const externalConfigRepository = new AuthoritiesMonitoringConfigD2Repository(api);
        const MessageRepository = new MessageMSTeamsRepository(webhook);

        log.debug(`Get config: ${auth.apiurl}`);

        log.info(`Run user authorities monitoring`);
        const config = await new GetAuthoritiesMonitoringConfigUseCase(externalConfigRepository).execute();

        await new MonitorUsersByAuthorityUseCase(
            UserRolesRepository,
            externalConfigRepository,
            MessageRepository
        ).execute(config, args.setDataStore);
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

function getWebhookConfFromFile(config_file: string): WebhookOptions {
    const fs = require("fs");
    const configJSON = JSON.parse(fs.readFileSync("./" + config_file, "utf8"));
    const ms_url = configJSON["WEBHOOK"]["ms_url"];
    const proxy = configJSON["WEBHOOK"]["proxy"];
    const server_name = configJSON["WEBHOOK"]["server_name"];

    return {
        ms_url: ms_url,
        proxy: proxy,
        server_name: server_name,
    };
}

export type UserMonitoringAuth = { apiurl: string };
