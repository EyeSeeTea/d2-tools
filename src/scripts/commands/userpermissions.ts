import "json5/lib/register";
import { command, subcommands, option, string } from "cmd-ts";

import { getD2Api } from "scripts/common";
import { RunUserPermissionsUseCase } from "domain/usecases/RunUserPermissionsUseCase";
import { UserAuthoritiesD2Repository } from "data/UsersAuthoritiesD2Repository";
import { AuthOptions } from "domain/repositories/UsersRepository";
import log from "utils/log";
import { D2ExternalConfigRepository } from "data/D2ExternalConfigRepository";
import { GetServerConfigUseCase } from "domain/config/usecases/GetServerConfigUseCase";

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
    description:
        "Run user permissions, a --config-file must be provided (userspermissions run-users-permissions --config-file config.json)",
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
        const externalConfigRepository = new D2ExternalConfigRepository(api);
        log.debug(`Get config: ${auth.apiurl}`);

        const config = await new GetServerConfigUseCase(externalConfigRepository).execute();

        log.info(`Run user permissions`);
        new RunUserPermissionsUseCase(usersRepository).execute(config);
    },
});

function getAuthFromFile(config_file: string): AuthOptions {
    const fs = require("fs");
    const configJSON = JSON.parse(fs.readFileSync("./" + config_file, "utf8"));

    const apiurl: string =
        configJSON["URL"]["prefix"] +
        configJSON["URL"]["username"] +
        ":" +
        configJSON["URL"]["password"] +
        "@" +
        configJSON["URL"]["server"];
    return {
        apiurl: apiurl,
    };
}
