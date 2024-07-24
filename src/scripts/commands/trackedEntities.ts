import { createReadStream } from "fs";
import CsvReader from "csv-reader";
import _ from "lodash";
import { command, string, subcommands, option, flag } from "cmd-ts";
import { getApiUrlOptions, getD2ApiFromArgs } from "scripts/common";
import { Maybe } from "utils/ts-utils";
import { TrackedEntityD2Repository } from "data/TrackedEntityD2Repository";
import { TransferTrackedEntitiesUseCase } from "domain/usecases/TransferTrackedEntitiesUseCase";
import { TrackedEntityTransfer } from "domain/entities/TrackedEntity";

export function getCommand() {
    return subcommands({
        name: "trackedEntities",
        cmds: {
            transfer: transferTeisCommand,
        },
    });
}

const transferTeisCommand = command({
    name: "transfer",
    description: "Transfer tracked entities between organisation units",
    args: {
        ...getApiUrlOptions(),
        inputCsvFile: option({
            type: string,
            long: "input-file",
            description:
                "CSV file to read tracked entities from (expected columns: trackedEntityId, newOrgUnitId)",
        }),
        post: flag({
            long: "post",
            description: "Execute transfer actions",
        }),
    },
    handler: async args => {
        const api = getD2ApiFromArgs(args);
        const sourceRows = await readCSV<keyof TrackedEntityTransfer>(args.inputCsvFile);

        const transfers = _(sourceRows)
            .map((sourceRow): Maybe<TrackedEntityTransfer> => {
                const { trackedEntityId, newOrgUnitId } = sourceRow;
                return trackedEntityId && newOrgUnitId ? { trackedEntityId, newOrgUnitId } : undefined;
            })
            .compact()
            .value();

        const trackedEntityRepo = new TrackedEntityD2Repository(api);

        await new TransferTrackedEntitiesUseCase(trackedEntityRepo).execute(transfers, args);
    },
});

async function readCSV<Column extends string>(csvFilePath: string): Promise<Array<Record<Column, string>>> {
    return new Promise((resolve, reject) => {
        const inputStream = createReadStream(csvFilePath, "utf8");
        const results: Array<Record<Column, string>> = [];

        const reader = new CsvReader({
            parseNumbers: false,
            parseBooleans: false,
            trim: true,
            asObject: true,
        });

        inputStream
            .pipe(reader)
            .on("data", row => {
                results.push(row as Record<Column, string>);
            })
            .on("end", () => {
                resolve(results);
            })
            .on("error", error => {
                reject(error);
            });
    });
}
