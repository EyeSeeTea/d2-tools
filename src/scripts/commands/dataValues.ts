import _ from "lodash";
import { command, string, subcommands, option, positional, optional, flag, number, oneOf } from "cmd-ts";

import { getApiUrlOption, getD2Api, StringsSeparatedByCommas } from "scripts/common";
import { DataValuesD2Repository } from "data/DataValuesD2Repository";
import { RevertDataValuesUseCase } from "domain/usecases/RevertDataValuesUseCase";
import { GetDanglingValuesUseCase } from "domain/usecases/GetDanglingValuesUseCase";
import { DataSetsD2Repository } from "data/DataSetsD2Repository";
import { PostDanglingValuesUseCase } from "domain/usecases/PostDanglingValuesUseCase";
import { DanglingDataValuesCsvRepository } from "data/DanglingDataValuesCsvRepository";
import { NotificationsEmailRepository } from "data/NotificationsEmailRepository";
import { UserD2Repository } from "data/UserD2Repository";
import { SendNotificationDataValuesUseCase } from "domain/usecases/SendNotificationDataValuesUseCase";
import { OrgUnitD2Repository } from "data/OrgUnitD2Repository";
import { DataSetExecutionD2Repository } from "data/DataSetExecutionD2Repository";
import { SettingsD2Repository } from "data/SettingsD2Repository";
import { SettingsJsonRepository } from "data/SettingsJsonRepository";
import { DataSetExecutionJsonRepository } from "data/DataSetExecutionJsonRepository";

const SEND_EMAIL_AFTER_MINUTES = 5;

export function getCommand() {
    return subcommands({
        name: "datavalues",
        cmds: {
            revert: revertCmd,
            "get-dangling-values": getDanglingValuesCmd,
            "post-dangling-values": postDanglingValuesCmd,
            "monitoring-values": monitoringDataValues,
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
        const recipientRepository = new UserD2Repository(api);

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

const monitoringDataValues = command({
    name: "monitoring-values",
    description:
        "Notify data value changes and send an email depending on how long has passed since the last updated",
    args: {
        url: getApiUrlOption(),
        storage: option({
            type: oneOf(["datastore", "json"]),
            long: "storage",
            description: "datastore or json",
        }),
        settingsPath: option({
            type: string,
            long: "settings-path",
            description: "Path to json file that contains the dataset settings",
        }),
        executionsPath: option({
            type: string,
            long: "executions-path",
            description: "Path to json file that contains the dataset executions information",
        }),
        emailPathTemplate: option({
            type: string,
            long: "email-path-template",
            description: "Path to the json file with email template information",
        }),
        sendEmailAfterMinutes: option({
            type: number,
            long: "send-email-after-minutes",
            description: `Number of minutes to wait before sending the email notification. Default to ${SEND_EMAIL_AFTER_MINUTES}`,
            defaultValue: () => SEND_EMAIL_AFTER_MINUTES,
        }),
    },
    handler: async args => {
        const api = getD2Api(args.url);
        const dataSetsRepository = new DataSetsD2Repository(api);
        const dataValuesRepository = new DataValuesD2Repository(api);
        const orgUnitRepository = new OrgUnitD2Repository(api);
        const userRepository = new UserD2Repository(api);
        const notificationsRepository = new NotificationsEmailRepository();

        const isDataStoreStorage = args.storage === "datastore";

        const settingsRepository = isDataStoreStorage
            ? new SettingsD2Repository(api)
            : new SettingsJsonRepository();

        const dataStoreRepository = isDataStoreStorage
            ? new DataSetExecutionD2Repository(api)
            : new DataSetExecutionJsonRepository();

        new SendNotificationDataValuesUseCase(
            dataSetsRepository,
            dataValuesRepository,
            orgUnitRepository,
            dataStoreRepository,
            userRepository,
            notificationsRepository,
            settingsRepository
        ).execute(args);
    },
});
