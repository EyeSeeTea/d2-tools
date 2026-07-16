import fs from "fs";
import "json5/lib/register";
import * as Codec from "purify-ts";
import { command, subcommands, option, string, boolean, flag, optional } from "cmd-ts";

import { getD2ApiFromArgs } from "scripts/common";
import log from "utils/log";

import { RunTwoFactorReportUseCase } from "domain/usecases/user-monitoring/two-factor-monitoring/RunTwoFactorReportUseCase";
import { UserDateOverride } from "domain/entities/user-monitoring/two-factor-monitoring/TwoFactorUser";
import { isValidIso8601 } from "domain/entities/DateTime";

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
import { MessageMSTeamsRepository } from "data/user-monitoring/common/MessageMSTeamsRepository";
import { MSTeamsWebhookOptions } from "data/user-monitoring/entities/MSTeamsWebhookOptions";
import { MonitorUsersByAuthorityUseCase } from "domain/usecases/user-monitoring/authorities-monitoring/MonitorUsersByAuthorityUseCase";

import { UserGroupD2Repository } from "data/user-monitoring/user-groups-monitoring/UserGroupD2Repository";
import { UserGroupsMonitoringConfigD2Repository } from "data/user-monitoring/user-groups-monitoring/UserGroupsMonitoringConfigD2Repository";
import { MonitorUserGroupsUseCase } from "domain/usecases/user-monitoring/user-groups-monitoring/MonitorUserGroupsUseCase";

import { UserD2Repository } from "data/user-monitoring/user-templates-monitoring/UserD2Repository";
import { UserTemplatesMonitoringConfigD2Repository } from "data/user-monitoring/user-templates-monitoring/UserTemplatesMonitoringConfigD2Repository";
import { MonitorUserTemplatesUseCase } from "domain/usecases/user-monitoring/user-templates-monitoring/MonitorUserTemplatesUseCase";

import { UserRolesAuthoritiesD2Repository } from "data/user-monitoring/user-roles-authorities-monitoring/UserRolesAuthoritiesD2Repository";
import { UserRolesAuthoritiesMonitoringDataD2Repository } from "data/user-monitoring/user-roles-authorities-monitoring/UserRolesAuthoritiesMonitoringDataD2Repository";
import { AuthoritiesD2Repository } from "data/user-monitoring/user-roles-authorities-monitoring/AuthoritiesD2Repository";
import { MonitorUserRolesAuthoritiesUseCase } from "domain/usecases/user-monitoring/user-roles-authorities-monitoring/MonitorUserRolesAuthoritiesUseCase";

import { D2Api } from "types/d2-api";

export function getCommand() {
    return subcommands({
        name: "users-monitoring",
        cmds: {
            "run-permissions-fixer": runUsersMonitoringCmd,
            "run-2fa-reporter": run2FAReporterCmd,
            "run-authorities-monitoring": runAuthoritiesMonitoring,
            "run-user-groups-monitoring": runUserGroupMonitoringCmd,
            "run-user-templates-monitoring": runUserTemplateMonitoringCmd,
            "run-user-roles-authorities-monitoring": runUserRolesAuthoritiesMonitoringCmd,
        },
    });
}

const run2FAReporterCmd = command({
    name: "run-2fa-reporter",
    description:
        "Run user 2factor reporter, a --config-file must be provided (usermonitoring run-2fa-reporter --config-file config.json)",
    args: {
        configFile: option({
            type: string,
            long: "config-file",
            description: "Config file",
        }),
        disableusers: flag({
            type: boolean,
            short: "d",
            long: "disable-users",
            description: "Disable invalid twoFA users.",
        }),
        filteredByMonth: flag({
            type: boolean,
            short: "f",
            long: "filtered-by-month",
            description: "Filter users by creation date using disableAfterMonths from datastore config.",
        }),
        createdDateOverridesFile: option({
            type: optional(string),
            long: "created-date-overrides-file",
            description:
                "Path to a JSON file with user creation date overrides. Overrides the creation date used for the month-based filter for specific users. Only has effect when --filtered-by-month is set. Format: { \"createdDate\": \"YYYY-MM-DD\", \"users\": [{ \"id\": \"uid\", \"username\": \"name\" }] }",
        }),
    },

    handler: async args => {
        const api = getApiFromConfigFile(args.configFile);

        if (args.createdDateOverridesFile && !args.filteredByMonth) {
            log.warn(
                "--created-date-overrides-file has no effect without --filtered-by-month. Date overrides will be ignored."
            );
        }

        const userDateOverrides =
            args.filteredByMonth && args.createdDateOverridesFile
                ? parseUserDateOverridesFile(args.createdDateOverridesFile)
                : undefined;

        const usersRepository = new TwoFactorUserD2Repository(api);
        const externalConfigRepository = new TwoFactorConfigD2Repository(api);
        const userMonitoringReportRepository = new TwoFactorReportD2Repository(api);
        const programRepository = new UserMonitoringProgramD2Repository(api);
        log.info(`Run Report users without 2FA`);
        const response = await new RunTwoFactorReportUseCase(
            usersRepository,
            userMonitoringReportRepository,
            externalConfigRepository,
            programRepository
        ).execute({
            shouldDisableInvalidUsers: args.disableusers,
            filteredByMonth: args.filteredByMonth,
            userDateOverrides,
        });

        log.info(JSON.stringify(response));
    },
});

const runUsersMonitoringCmd = command({
    name: "run-permissions-fixer",
    description:
        "Run user monitoring, a --config-file must be provided (usermonitoring run-permissions-fixer --config-file config.json)",
    args: {
        configFile: option({
            type: string,
            long: "config-file",
            description: "Config file",
        }),
    },

    handler: async args => {
        const api = getApiFromConfigFile(args.configFile);
        const webhook = getWebhookConfFromFile(args.configFile);
        const usersRepository = new PermissionFixerUserD2Repository(api);
        const userGroupsRepository = new PermissionFixerUserGroupD2Repository(api);
        const usersTemplateRepository = new PermissionFixerTemplateD2Repository(api);
        const externalConfigRepository = new PermissionFixerConfigD2Repository(api);
        const userMonitoringReportRepository = new PermissionFixerReportD2Repository(api);
        const programRepository = new UserMonitoringProgramD2Repository(api);
        const messageRepository = new MessageMSTeamsRepository(webhook);
        log.info(`Run User permissions fixer`);
        await new RunUserPermissionUseCase(
            externalConfigRepository,
            userMonitoringReportRepository,
            usersTemplateRepository,
            userGroupsRepository,
            usersRepository,
            programRepository,
            messageRepository
        ).execute();
    },
});

const runAuthoritiesMonitoring = command({
    name: "run-authorities-monitoring",
    description:
        "Run user authorities monitoring, a --config-file must be provided (usersmonitoring run-permissions-fixer --config-file config.json)",
    args: {
        configFile: option({
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
        const api = getApiFromConfigFile(args.configFile);
        const webhook = getWebhookConfFromFile(args.configFile);
        const UserRolesRepository = new UserRolesD2Repository(api);
        const externalConfigRepository = new AuthoritiesMonitoringConfigD2Repository(api);
        const messageRepository = new MessageMSTeamsRepository(webhook);

        log.info(`Run user authorities monitoring`);
        await new MonitorUsersByAuthorityUseCase(
            UserRolesRepository,
            externalConfigRepository,
            messageRepository
        ).execute(args.setDataStore);
    },
});

const runUserGroupMonitoringCmd = command({
    name: "run-user-groups-monitoring",
    description:
        "Run user group monitoring, a --config-file must be provided (usermonitoring run-user-groups-monitoring --config-file config.json)",
    args: {
        configFile: option({
            type: string,
            long: "config-file",
            description: "Config file",
        }),
        setDataStore: flag({
            type: boolean,
            short: "s",
            long: "set-datastore",
            description:
                "Write users groups to datastore, use in script setup. It assumes there is a monitoring config in d2-tools/user-groups-monitoring",
        }),
    },

    handler: async args => {
        const api = getApiFromConfigFile(args.configFile);
        const webhook = getWebhookConfFromFile(args.configFile);

        const userGroupsRepository = new UserGroupD2Repository(api);
        const externalConfigRepository = new UserGroupsMonitoringConfigD2Repository(api);
        const messageRepository = new MessageMSTeamsRepository(webhook);

        log.info(`Run User group monitoring`);
        await new MonitorUserGroupsUseCase(
            userGroupsRepository,
            externalConfigRepository,
            messageRepository
        ).execute(args.setDataStore);
    },
});

const runUserTemplateMonitoringCmd = command({
    name: "run-user-templates-monitoring",
    description:
        "Run user template monitoring, a --config-file must be provided (usermonitoring run-user-templates-monitoring --config-file config.json)",
    args: {
        configFile: option({
            type: string,
            long: "config-file",
            description: "Config file",
        }),
        setDataStore: flag({
            type: boolean,
            short: "s",
            long: "set-datastore",
            description:
                "Write users templates to datastore, use in script setup. It assumes there is a monitoring config in d2-tools/user-templates-monitoring",
        }),
    },

    handler: async args => {
        const api = getApiFromConfigFile(args.configFile);
        const webhook = getWebhookConfFromFile(args.configFile);

        const usersRepository = new UserD2Repository(api);
        const externalConfigRepository = new UserTemplatesMonitoringConfigD2Repository(api);
        const messageRepository = new MessageMSTeamsRepository(webhook);

        log.info(`Run User template monitoring`);
        await new MonitorUserTemplatesUseCase(
            usersRepository,
            externalConfigRepository,
            messageRepository
        ).execute(args.setDataStore);
    },
});

const runUserRolesAuthoritiesMonitoringCmd = command({
    name: "run-user-roles-authorities-monitoring",
    description: "Run user roles authorities monitoring, a --config-file must be provided.",
    args: {
        configFile: option({
            type: string,
            long: "config-file",
            description: "Config file",
        }),
        setDataStore: flag({
            type: boolean,
            short: "s",
            long: "set-datastore",
            description:
                "Write users roles authorities to datastore, use in script setup. d2-tools/user-roles-authorities-monitoring can be empty, the script will populate it.",
        }),
    },

    handler: async args => {
        const api = getApiFromConfigFile(args.configFile);
        const webhook = getWebhookConfFromFile(args.configFile);

        const userRolesAuthoritiesRepository = new UserRolesAuthoritiesD2Repository(api);
        const authoritiesRepository = new AuthoritiesD2Repository(api);
        const monitoringDataRepository = new UserRolesAuthoritiesMonitoringDataD2Repository(api);
        const messageRepository = new MessageMSTeamsRepository(webhook);

        log.info(`Run user roles authorities monitoring`);
        await new MonitorUserRolesAuthoritiesUseCase(
            userRolesAuthoritiesRepository,
            authoritiesRepository,
            monitoringDataRepository,
            messageRepository
        ).execute(args.setDataStore);
    },
});

const localConfigCodec = Codec.Codec.interface({
    URL: Codec.Codec.interface({
        username: Codec.string,
        password: Codec.string,
        server: Codec.string,
    }),
});

const userDateOverrideCodec = Codec.Codec.interface({
    createdDate: Codec.string,
    users: Codec.array(
        Codec.Codec.interface({
            id: Codec.string,
            username: Codec.optional(Codec.string),
        })
    ),
});

function getApiFromConfigFile(configFile: string): D2Api {
    const configUnparsed = JSON.parse(fs.readFileSync(configFile, "utf8"));

    return localConfigCodec.decode(configUnparsed).caseOf({
        Left: errors => {
            throw new Error(`Error parsing ${configFile}: ${errors}`);
        },
        Right: config => {
            return getD2ApiFromArgs({
                url: config["URL"]["server"],
                auth: {
                    username: config["URL"]["username"],
                    password: config["URL"]["password"],
                },
            });
        },
    });
}

function getWebhookConfFromFile(configFile: string): MSTeamsWebhookOptions {
    const fs = require("fs");
    const configJSON = JSON.parse(fs.readFileSync("./" + configFile, "utf8"));
    const msUrl = configJSON["WEBHOOK"]["ms_url"];
    const proxy = configJSON["WEBHOOK"]["proxy"];
    const serverName = configJSON["WEBHOOK"]["server_name"];

    return {
        msUrl: msUrl,
        proxy: proxy,
        serverName: serverName,
    };
}

export function parseUserDateOverridesFile(filePath: string): UserDateOverride {
    let rawJson: unknown;
    try {
        rawJson = JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch {
        throw new Error(`Could not parse ${filePath} as JSON. Make sure the file contains valid JSON.`);
    }

    return userDateOverrideCodec.decode(rawJson).caseOf({
        Left: errors => {
            throw new Error(
                `Invalid format in ${filePath}: ${errors}. Expected { "createdDate": "YYYY-MM-DD", "users": [{ "id": "uid" }] }`
            );
        },
        Right: override => {
            if (!isValidIso8601(override.createdDate)) {
                throw new Error(
                    `Invalid createdDate "${override.createdDate}" in ${filePath}: must be a valid ISO date (e.g. "2026-06-10").`
                );
            }
            return override;
        },
    });
}

export type UserMonitoringAuth = { apiurl: string };
