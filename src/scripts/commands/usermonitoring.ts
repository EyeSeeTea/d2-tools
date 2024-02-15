import "json5/lib/register";
import { command, subcommands, option, string } from "cmd-ts";

import { getD2Api } from "scripts/common";
import { RunUserMonitoringUseCase as RunUserMonitoringUseCase } from "domain/usecases/RunUserMonitoringUseCase";
import log from "utils/log";
import { D2ExternalConfigRepository } from "data/D2ExternalConfigRepository";
import { GetUserMonitoringConfigUseCase } from "domain/config/usecases/GetUserMonitoringConfigUseCase";
import { UserMonitoringMetadataD2Repository } from "data/UserMonitoringMetadataD2Repository";
import { UserMonitoringReportD2Repository } from "data/UserMonitoringReportD2Repository";
import { UserAuthoritiesD2Repository } from "data/UserAuthoritiesD2Repository";
import { AuthOptions } from "domain/entities/UserMonitoring";

export function getCommand() {
    return subcommands({
        name: "users-monitoring",
        cmds: {
            "run-users-monitoring": runUsersMonitoringCmd,
        },
    });
}

const runUsersMonitoringCmd = command({
    name: "run-users-monitoring",
    description:
        "Run user monitoring, a --config-file must be provided (usersmonitoring run-users-monitoring --config-file config.json)",
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
        const usersRepository = new UserAuthoritiesD2Repository(api);
        const usersMonitoringMetadataRepository = new UserMonitoringMetadataD2Repository(api);
        const externalConfigRepository = new D2ExternalConfigRepository(api);
        const userMonitoringReportRepository = new UserMonitoringReportD2Repository(api);
        log.debug(`Get config: ${auth.apiurl}`);

        const config = await new GetUserMonitoringConfigUseCase(externalConfigRepository).execute();

        log.info(`Run user monitoring`);
        new RunUserMonitoringUseCase(
            usersRepository,
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
