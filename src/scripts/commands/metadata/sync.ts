import _ from "lodash";
import { command, string, option } from "cmd-ts";
import { buildAuthFromString, getD2ApiFromArgs, StringsSeparatedByCommas } from "scripts/common";
import { MetadataD2Repository } from "data/MetadataD2Repository";
import { readFileSync } from "fs";
import { SyncMetadataUseCase } from "domain/usecases/SyncMetadataUseCase";
import { SyncReport } from "./SyncReport";

type MetadataServer = {
    url: string;
    auth: string;
    isMain: boolean;
};

function getRepositoriesFromJsonFile(jsonFilePath: string) {
    const serverContentFile = readFileSync(jsonFilePath, "utf8");
    const { servers } = JSON.parse(serverContentFile) as unknown as { servers: MetadataServer[] };
    const mainServers = servers.filter(server => server.isMain);
    const mainServer = mainServers[0];
    if (mainServers.length !== 1 || !mainServer)
        throw new Error(
            "Only one server can be the main one. Set isMain: true to the server you want to be the main one"
        );

    return {
        mainMetadataRepository: new MetadataD2Repository(
            getD2ApiFromArgs({ url: mainServer.url, auth: buildAuthFromString(mainServer.auth) })
        ),
        repositories: servers
            .filter(server => !server.isMain)
            .map(
                server =>
                    new MetadataD2Repository(
                        getD2ApiFromArgs({ url: server.url, auth: buildAuthFromString(server.auth) })
                    )
            ),
    };
}

export const syncMetadata = command({
    name: "sync",
    description: "Sync metadata between DHIS2 instances",
    args: {
        modelsToCheck: option({
            type: StringsSeparatedByCommas,
            long: "check-models",
            description: "DHIS2 models, comma-separated (dataSets, organisationUnits, users, ...)",
        }),
        serverConfig: option({
            type: string,
            long: "server-config",
            description: "Path to the JSON file with server configurations",
        }),
    },
    handler: async args => {
        const metadataReposFromFile = getRepositoriesFromJsonFile(args.serverConfig);
        const report = await new SyncMetadataUseCase(
            metadataReposFromFile.mainMetadataRepository,
            metadataReposFromFile.repositories
        ).execute({ modelsToCheck: args.modelsToCheck });

        new SyncReport().generateCsvReports(report);
    },
});
