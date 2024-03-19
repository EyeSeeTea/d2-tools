import _ from "lodash";
import { command, string, option, optional, subcommands } from "cmd-ts";
import { getApiUrlOption, getD2Api, StringsSeparatedByCommas } from "scripts/common";
import { SyncValidateUseCase } from "domain/usecases/SyncValidateUseCase";
import { MetadataD2Repository } from "data/MetadataD2Repository";

export function getCommand() {
    const validateCmd = command({
        name: "validate",
        description: "Run validation checks for sync-able instances",
        args: {
            url1: getApiUrlOption({ long: "url" }),
            url2: option({
                type: optional(string),
                long: "url2",
                description: "http://USERNAME:PASSWORD@HOST:PORT",
            }),
            modelsToCheck: option({
                type: StringsSeparatedByCommas,
                long: "check-models",
                description: "DHIS2 models, comma-separated (dataSets, organisationUnits, users, ...)",
            }),
        },
        handler: async args => {
            const api1 = getD2Api(args.url1);
            const api2 = args.url2 ? getD2Api(args.url2) : api1;
            const metadataRepository1 = new MetadataD2Repository(api1);
            const metadataRepository2 = new MetadataD2Repository(api2);

            await new SyncValidateUseCase(metadataRepository1, metadataRepository2).execute(args);
        },
    });

    return subcommands({
        name: "sync",
        cmds: { validate: validateCmd },
    });
}
