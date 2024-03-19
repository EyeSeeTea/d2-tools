import _ from "lodash";
import { command, string, subcommands, option, optional } from "cmd-ts";

import { getApiUrlOption, getD2Api } from "scripts/common";
import { UpdateCategoryOptionPermissionsUseCase } from "domain/usecases/UpdateCategoryOptionPermissionsUseCase";
import { CategoryOptionD2Repository } from "data/CategoryOptionD2Repository";
import { CategoryOptionSettingsJsonRepository } from "data/CategoryOptionSettingsJsonRepository";
import { CategoryOptionSpreadsheetCsvRepository } from "data/CategoryOptionSpreadsheetCsvRepository";
import logger from "utils/log";
import { UserGroupD2Repository } from "data/UserGroupD2Repository";

export function getCommand() {
    return subcommands({
        name: "categoryoptions",
        cmds: {
            "update-sharing": updateSharingCmd,
        },
    });
}

const updateSharingCmd = command({
    name: "update-sharing",
    description: "Update sharing of category options",
    args: {
        url: getApiUrlOption(),
        settingsPath: option({
            type: string,
            long: "settings-path",
            description: "Path to json file with configuration",
        }),
        csvPath: option({
            type: optional(string),
            long: "csv-path",
            description: "Path to the csv report",
        }),
    },
    handler: async args => {
        const api = getD2Api(args.url);
        const categoryOptionRepository = new CategoryOptionD2Repository(api);
        const categoryOptionSettingsRepository = new CategoryOptionSettingsJsonRepository();
        const categoryOptionSpreadSheetRepository = new CategoryOptionSpreadsheetCsvRepository();
        const userGroupRepository = new UserGroupD2Repository(api);
        await new UpdateCategoryOptionPermissionsUseCase(
            categoryOptionRepository,
            categoryOptionSettingsRepository,
            categoryOptionSpreadSheetRepository,
            userGroupRepository
        ).execute(args);
        if (!args.csvPath) {
            logger.info("Pass --csv-path to generate report");
        }
    },
});
