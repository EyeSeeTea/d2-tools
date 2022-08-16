import _ from "lodash";
import { command, string, subcommands, option, positional, optional } from "cmd-ts";

import { getApiUrlOption, getD2Api, StringsSeparatedByCommas } from "scripts/common";
import { DataValuesD2Repository } from "data/DataValuesD2Repository";
import { RevertDataValuesUseCase } from "domain/usecases/RevertDataValuesUseCase";

export function getCommand() {
    return subcommands({
        name: "datavalues",
        cmds: { revert: revertCmd },
    });
}

const revertCmd = command({
    name: "revert",
    description: "Revert data values using audits",
    args: {
        url: getApiUrlOption(),
        dataSetIds: option({
            type: StringsSeparatedByCommas,
            long: "dataset-ids",
            description: "List of data set IDS to get data values from (comma-separated)",
        }),
        orgUnitIds: option({
            type: StringsSeparatedByCommas,
            long: "orgunit-ids",
            description: "List of org unit IDS to get data values from (comma-separated)",
        }),
        periods: option({
            type: StringsSeparatedByCommas,
            long: "periods",
            description: "List of periods to get data values from (comma-separated)",
        }),
        date: option({
            type: string,
            long: "date",
            description:
                "Date in ISO 8601 format (YYYY-MM-DDTHH:MM:SS). Data values will be reverted using the audit from the oldest date after or equal to that date",
        }),
        usernames: option({
            type: optional(StringsSeparatedByCommas),
            long: "usernames",
            description:
                "Consider only data values currently stored for the given usernames (comma-separated)",
        }),
        outputFile: positional({
            type: string,
            displayName: "PATH_TO_JSON",
            description: "Output file (JSON)",
        }),
    },
    handler: async args => {
        const api = getD2Api(args.url);
        const dataValuesRepository = new DataValuesD2Repository(api);
        new RevertDataValuesUseCase(dataValuesRepository).execute(args);
    },
});
