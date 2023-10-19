import _ from "lodash";
import { Async } from "domain/entities/Async";
import {
    CategoryOption,
    GroupPermission,
    PublicPermission,
    Permission,
} from "domain/entities/CategoryOption";
import { CategoryOptionRepository } from "domain/repositories/CategoryOptionRepository";
import { Maybe } from "utils/ts-utils";
import logger from "utils/log";
import { CategoryOptionSettingsRepository } from "domain/repositories/CategoryOptionSettingsRepository";
import { promiseMap } from "data/dhis2-utils";
import {
    CategoryOptionSettings,
    GroupPermissionSetting,
    PermissionImportMode,
    PermissionSetting,
    PublicPermissionSetting,
    RegularExpresionValue,
} from "domain/entities/CategoryOptionSettings";
import { Name, Path } from "domain/entities/Base";
import { CategoryOptionSpreadsheetRepository } from "domain/repositories/CategoryOptionSpreadsheetRepository";
import { UserGroupRepository } from "domain/repositories/UserGroupRepository";
import { UserGroup } from "domain/entities/UserGroup";

const MATCH_EVERYTHING_SYMBOL = "*";
export class UpdateCategoryOptionPermissionsUseCase {
    constructor(
        private categoryOptionRepository: CategoryOptionRepository,
        private categoryOptionSettingsRepository: CategoryOptionSettingsRepository,
        private categoryOptionSpreadSheetRepository: CategoryOptionSpreadsheetRepository,
        private userGroupRepository: UserGroupRepository
    ) {}

    async execute(options: UpdateCategoryOptionPermissionsParams): Async<void> {
        const settings = await this.categoryOptionSettingsRepository.get(options.settingsPath);

        logger.debug("Fetching user groups");
        const userGroupsByName = await this.getUserGroups();

        logger.debug("Fetching category options...");
        const categoryOptions = await this.categoryOptionRepository.getAll({
            page: 1,
        });
        logger.debug(`${categoryOptions.length} category options found`);

        const catOptionsWithFilters = this.generateCategoryOptionsByFilters(
            settings,
            categoryOptions,
            userGroupsByName
        );

        await this.saveCategoryOptions(catOptionsWithFilters);

        if (options.csvPath) {
            this.generateReport(catOptionsWithFilters, options.csvPath, settings, userGroupsByName);
        }
    }

    private generateCategoryOptionsByFilters(
        settings: CategoryOptionSettings,
        categoryOptions: CategoryOption[],
        userGroupsByName: UserGroupsByName
    ) {
        return _(this.getKeysFromSettings(settings))
            .map((setting): Maybe<CategoryOptionsWithFilter> => {
                const catOptionsFiltered =
                    setting === MATCH_EVERYTHING_SYMBOL
                        ? categoryOptions
                        : this.filterCategoryOptions(categoryOptions, setting);

                const settingValue = settings[setting];
                if (!settingValue) return undefined;

                const allNewPermissions = this.getPermissionsFromSettings(settingValue, userGroupsByName);

                const catOptions = _(catOptionsFiltered)
                    .map(catOption => {
                        if (settingValue.groups) {
                            const groupsMatch = this.getMatchUserGroups(settingValue, userGroupsByName);
                            if (groupsMatch.length === 0) return undefined;
                        }
                        return this.updatePermissions(
                            catOption,
                            allNewPermissions,
                            settingValue.permissionImportMode
                        );
                    })
                    .compact()
                    .value();

                return { filter: setting, categoryOptions: catOptions };
            })
            .compact()
            .value();
    }

    private getMatchUserGroups(settingValue: PermissionSetting, userGroupsByName: UserGroupsByName) {
        return _(settingValue.groups)
            .map(group => {
                const userGroup = userGroupsByName[group.filter.toLowerCase()];
                return userGroup?.name;
            })
            .compact()
            .value();
    }

    private async saveCategoryOptions(
        catOptionsWithFilters: CategoryOptionsWithFilter[]
    ): Async<CategoryOptionsWithFilter[]> {
        const savedCategoryOptions = await promiseMap(catOptionsWithFilters, async catOptionsWithFilter => {
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
                return {
                    ...catOptionsWithFilter,
                    categoryOptions: onlySuccessCatOptions,
                };
            } else {
                logger.info(
                    `${catOptionsWithFilter.categoryOptions.length} category options found with filter: ${catOptionsWithFilter.filter}`
                );
                return undefined;
            }
        });

        return _(savedCategoryOptions).compact().value();
    }

    private async getUserGroups(): Async<UserGroupsByName> {
        const userGroups = await this.userGroupRepository.getAll();
        logger.debug(`${userGroups.length} userGroups found`);
        const userGroupsByName = _.keyBy(userGroups, userGroup => userGroup.name.toLowerCase());
        return userGroupsByName;
    }

    private getPermissionsFromSettings(settingValue: PermissionSetting, userGroupsByName: UserGroupsByName) {
        const publicPermissionFromSettings = settingValue.public
            ? this.generatePublicPermissions(settingValue.public)
            : [];

        const groupsPermissionsFromSettings = settingValue.groups
            ? this.generateGroupPermissions(settingValue.groups, userGroupsByName)
            : [];

        return [...publicPermissionFromSettings, ...groupsPermissionsFromSettings];
    }

    private generatePublicPermissions(publicSetting: PublicPermissionSetting): PublicPermission[] {
        return [
            {
                type: "public",
                value: publicSetting.value,
            },
        ];
    }

    private generateGroupPermissions(
        groupsSettings: GroupPermissionSetting[],
        userGroups: UserGroupsByName
    ): GroupPermission[] {
        return _(groupsSettings)
            .map((groupSetting): Maybe<GroupPermission> => {
                const userGroup = userGroups[groupSetting.filter.toLowerCase()];
                if (!userGroup) {
                    logger.debug(`Cannot find user group with name ${groupSetting.filter}`);
                    return undefined;
                }
                return {
                    type: "groups",
                    id: userGroup.id,
                    name: userGroup.name,
                    value: groupSetting.value,
                };
            })
            .compact()
            .value();
    }

    private updatePermissions(
        catOption: CategoryOption,
        allNewPermissions: Permission[],
        importMode: PermissionImportMode
    ): CategoryOption {
        return {
            ...catOption,
            permissions:
                importMode === "overwrite"
                    ? allNewPermissions
                    : _(allNewPermissions).unionBy(catOption.permissions, "id").value(),
        };
    }

    private filterCategoryOptions(catOptions: CategoryOption[], regexValue: string): CategoryOption[] {
        const result = catOptions.filter(catOpt => {
            return this.validateAgainstRegExp(catOpt.code, regexValue);
        });
        logger.debug(`${result.length} category options with filter: ${regexValue}`);
        return result;
    }

    private validateAgainstRegExp(value: string, regex: string): boolean {
        const regExp = new RegExp(regex, "i");
        return regExp.test(value);
    }

    private async generateReport(
        categoryOptionsWithFilters: CategoryOptionsWithFilter[],
        path: Path,
        settings: CategoryOptionSettings,
        userGroups: UserGroupsByName
    ): Async<void> {
        logger.info("Generating csv report...");
        const reportData = _(this.getKeysFromSettings(settings))
            .map(filterValue => {
                const settingValue = settings[filterValue];
                if (!settingValue) return undefined;
                const categoryOptionsWithFilter = categoryOptionsWithFilters.find(
                    c => c.filter === filterValue
                );
                if (!categoryOptionsWithFilter) return undefined;
                const groupsSettings = _(settingValue.groups)
                    .map(group => {
                        return userGroups[group.filter.toLowerCase()]
                            ? undefined
                            : group.filter.toUpperCase();
                    })
                    .compact()
                    .value();

                return {
                    filter: categoryOptionsWithFilter.filter,
                    missingGroups: groupsSettings.join(","),
                    categoryOptions: categoryOptionsWithFilter.categoryOptions,
                };
            })
            .compact()
            .value();

        await this.categoryOptionSpreadSheetRepository.saveReport({
            categoryOptions: reportData,
            reportPath: path,
        });
        logger.info(`Report generated to: ${path}`);
    }

    private getKeysFromSettings(settings: CategoryOptionSettings): string[] {
        const keys = Object.keys(settings);
        return keys;
    }
}

export type UpdateCategoryOptionPermissionsParams = {
    settingsPath: Path;
    csvPath: Maybe<Path>;
};

type CategoryOptionsWithFilter = {
    filter: RegularExpresionValue;
    categoryOptions: CategoryOption[];
};

type UserGroupsByName = Record<Name, UserGroup>;
