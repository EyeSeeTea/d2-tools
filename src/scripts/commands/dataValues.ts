import _ from "lodash";
import { command, string, subcommands, option, positional, optional, flag } from "cmd-ts";

import { getApiUrlOption, getD2Api, StringsSeparatedByCommas } from "scripts/common";
import { DataValuesD2Repository } from "data/DataValuesD2Repository";
import { RevertDataValuesUseCase } from "domain/usecases/RevertDataValuesUseCase";
import { GetDanglingValuesUseCase } from "domain/usecases/GetDanglingValuesUseCase";
import { DataSetsD2Repository } from "data/DataSetsD2Repository";
import { PostDanglingValuesUseCase } from "domain/usecases/PostDanglingValuesUseCase";
import { DanglingDataValuesCsvRepository } from "data/DanglingDataValuesCsvRepository";
import { NotificationsEmailRepository } from "data/NotificationsEmailRepository";
import { RecipientD2Repository } from "data/RecipientD2Repository";

export function getCommand() {
    return subcommands({
        name: "datavalues",
        cmds: {
            revert: revertCmd,
            "get-dangling-values": getDanglingValuesCmd,
            "post-dangling-values": postDanglingValuesCmd,
        },
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

const getDanglingValuesCmd = command({
    name: "get-dangling-values",
    description: "Get dangling data values (data values without assignable data set)",
    args: {
        url: getApiUrlOption(),
        dataSetIds: option({
            type: optional(StringsSeparatedByCommas),
            long: "dataset-ids",
            description: "List of data set IDS to get data values from (comma-separated)",
        }),
        orgUnitIds: option({
            type: optional(StringsSeparatedByCommas),
            long: "orgunit-ids",
            description: "List of org unit IDS to get data values from (comma-separated)",
        }),
        includeOrgUnitChildren: flag({
            long: "include-orgunits-children",
            description: "Include organisation unit children data values",
        }),
        periods: option({
            type: optional(StringsSeparatedByCommas),
            long: "periods",
            description: "List of periods to get data values from (comma-separated)",
        }),
        startDate: option({
            type: optional(string),
            long: "start-date",
            description: "Start date (ISO8601 format)",
        }),
        endDate: option({
            type: optional(string),
            long: "end-date",
            description: "End date (ISO8601 format)",
        }),
        orgUnitGroupIds: option({
            type: optional(StringsSeparatedByCommas),
            long: "orgunitgroup-ids",
            description: "List of organisation unit group IDS to get data values from (comma-separated)",
        }),
        dataElementGroupIds: option({
            type: StringsSeparatedByCommas,
            long: "dataelementgroup-ids",
            description: "List of data element group IDS to get data values from (comma-separated)",
        }),
        limit: option({
            type: optional(string),
            long: "limit",
            description: "Limit data values count",
        }),
        notify: option({
            type: optional(StringsSeparatedByCommas),
            long: "notify-email",
            description: "Send report to emails/userId/userGroupIds (comma-separated)",
        }),
        outputFile: positional({
            type: string,
            displayName: "PATH_TO_CSV",
            description: "Output file (CSV)",
        }),
    },
    handler: async args => {
        const api = getD2Api(args.url);
        const dataSetsRepository = new DataSetsD2Repository(api);
        const dataValuesRepository = new DataValuesD2Repository(api);
        const danglingDataValuesRepository = new DanglingDataValuesCsvRepository();
        const notificationsRepository = new NotificationsEmailRepository();
        const recipientRepository = new RecipientD2Repository(api);

        new GetDanglingValuesUseCase(
            dataSetsRepository,
            dataValuesRepository,
            danglingDataValuesRepository,
            notificationsRepository,
            recipientRepository
        ).execute(args);
    },
});

const postDanglingValuesCmd = command({
    name: "post-dangling-values",
    description: "Post dangling data values (data values without assignable data set)",
    args: {
        url: getApiUrlOption(),
        inputFile: positional({
            type: string,
            displayName: "PATH_TO_CSV",
            description: "Input file (CSV)",
        }),
        savePayload: option({
            type: optional(string),
            long: "save-payload",
            description: "Generate payload to JSON file and exit without posting it",
        }),
    },
    handler: async args => {
        const api = getD2Api(args.url);
        const dataValuesRepository = new DataValuesD2Repository(api);
        const danglingDataValuesRepository = new DanglingDataValuesCsvRepository();
        new PostDanglingValuesUseCase(dataValuesRepository, danglingDataValuesRepository).execute(args);
    },
});
