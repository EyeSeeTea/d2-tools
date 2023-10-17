import _ from "lodash";
import { Async } from "domain/entities/Async";
import {
    CategoryOption,
    GroupPermission,
    UnixFilePermission,
    PublicPermission,
} from "domain/entities/CategoryOption";
import { CategoryOptionRepository } from "domain/repositories/CategoryOptionRepository";
import { Maybe } from "utils/ts-utils";
import logger from "utils/log";
import { CategoryOptionSettingsRepository } from "domain/repositories/CategoryOptionSettingsRepository";
import { promiseMap } from "data/dhis2-utils";
import { PermissionSetting } from "domain/entities/CategoryOptionSettings";
import { Path } from "domain/entities/Base";
import { CategoryOptionSpreadsheetRepository } from "domain/repositories/CategoryOptionSpreadsheetRepository";

const MATCH_EVERYTHING_SYMBOL = "*";

export class UpdateCategoryOptionPermissionsUseCase {
    constructor(
        private categoryOptionRepository: CategoryOptionRepository,
        private categoryOptionSettingsRepository: CategoryOptionSettingsRepository,
        private categoryOptionSpreadSheetRepository: CategoryOptionSpreadsheetRepository
    ) {}

    async execute(options: UpdateCategoryOptionPermissionsParams): Async<void> {
        const settings = await this.categoryOptionSettingsRepository.get(options.settingsPath);

        logger.debug("Fetching category options...");
        const categoryOptions = await this.categoryOptionRepository.getAll({
            page: 1,
        });
        logger.debug(`${categoryOptions.length} category options found`);

        const settingsKeys = Object.keys(settings);
        const catOptionsWithFilters = _(settingsKeys)
            .map((setting): Maybe<CategoryOptionsWithFilterValue> => {
                const catOptionsFiltered =
                    setting === MATCH_EVERYTHING_SYMBOL
                        ? categoryOptions
                        : this.filterCategoryOptions(categoryOptions, setting);

                const settingValue = settings[setting];
                if (!settingValue) return undefined;

                const catOptions = catOptionsFiltered.map(catOption =>
                    this.updatePermissions(catOption, settingValue)
                );

                return { filter: setting, categoryOptions: catOptions };
            })
            .compact()
            .value();

        const catOptionsSaved = await promiseMap(catOptionsWithFilters, async catOptionsWithFilter => {
            const totalCatOptions = catOptionsWithFilter.categoryOptions.length;
            if (totalCatOptions > 0) {
                logger.info(
                    `Saving ${catOptionsWithFilter.categoryOptions.length} category options with filter: ${catOptionsWithFilter.filter}`
                );
                const stats = await this.categoryOptionRepository.saveAll(
                    catOptionsWithFilter.categoryOptions
                );
                logger.debug(JSON.stringify(stats, null, 4));
                const onlySuccessCatOptions = _.differenceWith(
                    catOptionsWithFilter.categoryOptions,
                    stats.recordsSkipped,
                    (catOption, skipId) => catOption.id === skipId
                );
                return onlySuccessCatOptions;
            } else {
                logger.info(
                    `${catOptionsWithFilter.categoryOptions.length} category options found with filter: ${catOptionsWithFilter.filter}`
                );
                return [];
            }
        });

        if (options.csvPath) {
            this.generateReport(_(catOptionsSaved).flatMap().value(), options.csvPath);
        }
    }

    private updatePermissions(catOption: CategoryOption, settingValue: PermissionSetting) {
        return {
            ...catOption,
            permissions: catOption.permissions.map(permission => {
                if (settingValue.public && permission.type === "public") {
                    return this.updatePublicPermission(permission, settingValue.public.value);
                }

                if (settingValue.groups && settingValue.groups.length > 0 && permission.type === "groups") {
                    return this.updateGroupPermission(settingValue, permission);
                }

                return permission;
            }),
        };
    }

    private filterCategoryOptions(catOptions: CategoryOption[], regexValue: string): CategoryOption[] {
        const result = catOptions.filter(catOpt => {
            return this.validateAgainstRegExp(catOpt.code, regexValue);
        });
        logger.debug(`${result.length} category options with filter: ${regexValue}`);
        return result;
    }

    private updatePublicPermission(
        permission: PublicPermission,
        newValue: UnixFilePermission
    ): PublicPermission {
        return { ...permission, value: newValue };
    }

    private updateGroupPermission(
        settingValue: PermissionSetting,
        permission: GroupPermission
    ): GroupPermission {
        const groupMatch = settingValue.groups?.find(group => {
            return this.validateAgainstRegExp(permission.name, group.filter);
        });

        return _.isUndefined(groupMatch)
            ? permission
            : { ...permission, value: groupMatch ? groupMatch.value : permission.value };
    }

    private validateAgainstRegExp(value: string, regex: string): boolean {
        const regExp = new RegExp(regex, "i");
        return regExp.test(value);
    }

    private async generateReport(categoryOptions: CategoryOption[], path: Path): Async<void> {
        logger.info("Generating csv report...");
        await this.categoryOptionSpreadSheetRepository.saveReport(categoryOptions, path);
        logger.info(`Report generated to ${path}`);
    }
}

export type UpdateCategoryOptionPermissionsParams = {
    settingsPath: Path;
    csvPath: Maybe<Path>;
};

type CategoryOptionsWithFilterValue = {
    filter: string;
    categoryOptions: CategoryOption[];
};
