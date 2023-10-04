import _ from "lodash";
import jsonfile from "jsonfile";
import log from "utils/log";
import { DataValuesRepository } from "domain/repositories/DataValuesRepository";
import { DataSetsRepository } from "domain/repositories/DataSetsRepository";
import { OrgUnitRepository } from "domain/repositories/OrgUnitRepository";
import { DataSet } from "domain/entities/DataSet";
import { OrgUnit } from "domain/entities/OrgUnit";
import { ExecutionRepository } from "domain/repositories/ExecutionRepository";
import { promiseMap } from "data/dhis2-utils";
import { UserRepository } from "domain/repositories/UserRepository";
import { NotificationsRepository } from "domain/repositories/NotificationsRepository";
import { DataValue } from "domain/entities/DataValue";
import { User } from "domain/entities/User";
import { Id, Identifiable, Path } from "domain/entities/Base";
import { Async } from "domain/entities/Async";
import { SettingsRepository } from "domain/repositories/SettingsRepository";
import { DataElementMonitoring, MonitoringConfig, Settings } from "domain/entities/Settings";
import { TimeZoneRepository } from "domain/repositories/TimeZoneRepository";
import { DateTime } from "luxon";

const emptyDeExecution = { dataElementsExecutions: undefined, dataSets: [], users: [] };

type EmailTemplate = {
    subject: string;
    body: string;
};

export type NotificationDetail = {
    lastDateSentEmail: string;
    lastUpdated: string;
    settings?: DataElementMonitoring;
};

type ExecutionType = "dataSets" | "dataElements";
export type Execution = Record<ExecutionType, ExecutionInfo | undefined>;
export type ExecutionInfo = Record<string, NotificationDetail>;

type OptionsUseCase = {
    settingsPath: string;
    executionsPath: string;
    emailDsPathTemplate: string;
    emailDePathTemplate: string;
    sendEmailAfterMinutes: number;
    timeZone: string;
};

export class SendNotificationDataValuesUseCase {
    constructor(
        private dataSetsRepository: DataSetsRepository,
        private dataValuesRepository: DataValuesRepository,
        private orgUnitRepository: OrgUnitRepository,
        private executionRepository: ExecutionRepository,
        private userRepository: UserRepository,
        private notificationsRepository: NotificationsRepository,
        private settingsRepository: SettingsRepository,
        private timeZoneRepository: TimeZoneRepository
    ) {}

    async execute(options: OptionsUseCase) {
        const { timeZoneIANACode: timeZone } = options.timeZone
            ? { timeZoneIANACode: options.timeZone }
            : await this.timeZoneRepository.get();
        const currentDate = DateTime.local().setZone(timeZone).toISO();
        if (!currentDate) {
            throw Error(`Could not get server date from timezone ${timeZone}`);
        }
        log.debug(`Server Date: ${currentDate} - ${timeZone}`);

        const settings = await this.getSettings(options);
        const execution = await this.executionRepository.get({
            path: options.executionsPath,
        });

        const {
            dataElementsExecutions,
            users,
            dataSets: dataElementsDataSets,
        } = await this.getDataElementExecutions({ dataElementExecution: execution?.dataElements, settings });

        const { dataSetExecutions, dataSets, orgUnits } = await this.getDataSetsExecutions(
            settings,
            execution?.dataSets
        );

        const executionsToSave = { dataSets: dataSetExecutions, dataElements: dataElementsExecutions };
        await this.saveExecutions(executionsToSave, options);

        if (dataSetExecutions) {
            await this.startDataSetExecutions(
                executionsToSave,
                dataSets,
                settings,
                options,
                orgUnits,
                timeZone
            );
        }

        if (dataElementsExecutions) {
            await this.startDataElementsExecutions({
                executions: executionsToSave,
                dataSets: dataElementsDataSets,
                options,
                timeZone,
                users,
            });
        }
    }

    private async getDataElementExecutions({
        dataElementExecution,
        settings,
    }: {
        dataElementExecution: ExecutionInfo | undefined;
        settings: Settings;
    }): Async<{ dataElementsExecutions: ExecutionInfo | undefined; dataSets: DataSet[]; users: User[] }> {
        if (!settings.dataElements) return emptyDeExecution;
        const enabledDataElements = settings.dataElements.filter(setting => setting.enabled);
        if (enabledDataElements.length === 0) return emptyDeExecution;
        const dataSetsCodes = enabledDataElements.map(setting => setting.dataSet);
        const userCodes = enabledDataElements.flatMap(setting => setting.users);
        const dataSets = await this.dataSetsRepository.getByIdentifiables(dataSetsCodes);
        const users = await this.userRepository.getByIdentifiables(userCodes);

        const dataElementKeyExecutions = enabledDataElements.map(dataElementSetting => {
            const dataSetIdentifiable = dataElementSetting.dataSet;
            const dataSet = dataSets.find(
                dataSet =>
                    dataSet.id === dataSetIdentifiable ||
                    dataSet.code === dataSetIdentifiable ||
                    dataSet.name === dataSetIdentifiable
            );

            if (!dataSet) throw Error(`Cannot found dataset: ${dataSetIdentifiable}`);
            const usersIds = dataElementSetting.users.map(userIdentifiable => {
                const userInfo = users.find(user => user.id === userIdentifiable);
                if (!userInfo) throw Error(`Cannot found user: ${userIdentifiable}`);
                return userInfo.id;
            });

            return [`${dataSet.id}-${usersIds.join(".")}`, dataElementSetting] as [
                string,
                DataElementMonitoring
            ];
        });

        const dataElementsExecutions = _(dataElementKeyExecutions)
            .map(([key, settings]) => {
                const storeInfo = dataElementExecution ? dataElementExecution[key] : undefined;
                return [
                    key,
                    {
                        lastDateSentEmail: storeInfo?.lastDateSentEmail || "",
                        lastUpdated: storeInfo?.lastUpdated || new Date().toISOString(),
                        settings,
                    },
                ] as [string, NotificationDetail];
            })
            .fromPairs()
            .value();

        return { dataElementsExecutions, dataSets, users };
    }

    private async startDataElementsExecutions({
        dataSets,
        executions,
        users,
        timeZone,
        options,
    }: {
        dataSets: DataSet[];
        executions: Execution;
        users: User[];
        timeZone: string;
        options: OptionsUseCase;
    }): Async<void> {
        const dataElementsExecutions = executions.dataElements;
        if (!dataElementsExecutions) return undefined;
        await promiseMap(_(dataElementsExecutions).keys().value(), async key => {
            const execution = dataElementsExecutions[key];
            if (!execution) return false;
            const [dataSetId, usersKeys] = key.split("-");
            if (!dataSetId || !usersKeys) {
                throw Error("Cannot found dataset or users in DataElement execution");
            }
            log.debug("------------------------");
            log.debug(`Starting DataElement execution: ${key}`);

            const dataSetInfo = dataSets.find(dataSet => dataSet.id === dataSetId);
            if (!dataSetInfo) throw Error(`Cannot found dataset ${dataSetId}`);

            const dataElementsInfo = execution.settings?.dataElements.map(dataElement => {
                const deInfo = dataSetInfo.dataSetElements.find(
                    de =>
                        de.dataElement.id === dataElement ||
                        de.dataElement.name === dataElement ||
                        de.dataElement.code === dataElement
                );
                if (!deInfo) throw Error(`Cannot found dataElement: ${dataElement}`);
                return deInfo.dataElement;
            });

            const dataElementsIds = _(dataElementsInfo)
                .map(de => de.id)
                .value();

            const currentUsers = _(execution.settings?.users)
                .map(userId => {
                    const user = users.find(user => user.id === userId);
                    if (!user) return undefined;
                    return user;
                })
                .compact()
                .value();

            const lastUpdatedDateTimeLocal = this.getLocalTimeFromDateString(execution.lastUpdated, timeZone);
            const orgUnitIds = _(currentUsers)
                .flatMap(user => user.orgUnits || [])
                .map(ou => ou.id)
                .value();

            const dataValues = await this.getDataValues(
                [dataSetId],
                orgUnitIds,
                undefined,
                lastUpdatedDateTimeLocal,
                true,
                dataElementsIds
            );

            const diffSinceLastUpdate = this.diffSinceLastUpdate(dataValues);
            if (
                diffSinceLastUpdate &&
                diffSinceLastUpdate >= options.sendEmailAfterMinutes &&
                execution.settings?.users
            ) {
                const dataValuesWithOldValue = await this.getOldDataValues(
                    dataValues,
                    [dataSetId],
                    undefined,
                    undefined,
                    dataElementsIds
                );

                const { subject, body } = await this.generateDataElementTemplate(
                    dataValuesWithOldValue,
                    dataSetInfo,
                    options
                );

                await this.sendEmailToUsersInGroup(users, subject, body);

                await this.saveExecutionsWithEmail(
                    execution,
                    executions,
                    key,
                    options,
                    dataValues,
                    timeZone,
                    "dataElements"
                );
            }
        });
    }

    private async generateDataElementTemplate(
        dataValuesWithOldValue: DataValue[],
        dataSetInfo: DataSet,
        options: OptionsUseCase
    ) {
        const dataValuesWithDeName = _(dataValuesWithOldValue)
            .map(dataValue => {
                const dataElementName = dataSetInfo.dataSetElements.find(
                    de => de.dataElement.id === dataValue.dataElement
                )?.dataElement.name;

                const orgUnit = dataSetInfo.organisationUnits.find(ou => ou.id === dataValue.orgUnit);

                return {
                    ...dataValue,
                    name: dataElementName,
                    orgUnitName: orgUnit?.name || "",
                };
            })
            .compact()
            .value();

        const dataTemplate = {
            dataSetName: dataSetInfo.name,
            orgUnitName: "",
            period: "",
            dataValues: dataValuesWithDeName,
        };
        const emailTemplate = await this.getEmailTemplate(options.emailDePathTemplate);
        return this.parseEmailContent(emailTemplate, dataTemplate);
    }

    private async getDataValues(
        dataSetIds: Id[],
        orgUnitIds: Id[],
        periods: string[] | undefined,
        lastUpdated: string,
        includeChildren: boolean = false,
        excludeDataElements: Id[] | undefined
    ): Async<DataValue[]> {
        const dataValues = await this.dataValuesRepository.get({
            includeDeleted: false,
            dataSetIds,
            orgUnitIds,
            children: includeChildren,
            periods,
            // Forcing this date to act like UTC because
            // /api/dataValueSets return incorrect
            // values if you include real offset
            lastUpdated: `${lastUpdated}Z`,
        });
        const filterDataValues = excludeDataElements
            ? dataValues.filter(dv => excludeDataElements.includes(dv.dataElement))
            : dataValues;
        log.debug(`Getting ${filterDataValues.length} datavalues for execution`);
        return filterDataValues;
    }

    private getLocalTimeFromDateString(date: string, timeZone: string) {
        const lastUpdatedDateTimeLocal = DateTime.fromISO(date, {
            zone: timeZone,
        }).toISO({
            includeOffset: false,
        });
        if (!lastUpdatedDateTimeLocal) {
            throw Error(`Cannot get local time: ${date}-${timeZone}`);
        }
        return lastUpdatedDateTimeLocal;
    }

    private async startDataSetExecutions(
        executions: Execution,
        dataSets: DataSet[],
        settings: Settings,
        options: OptionsUseCase,
        orgUnits: OrgUnit[],
        timeZone: string
    ) {
        const dataSetExecutions = executions.dataSets;
        await promiseMap(_(dataSetExecutions).keys().value(), async key => {
            const execution = dataSetExecutions ? dataSetExecutions[key] : undefined;
            if (!execution) return false;
            const [dataSetId, orgUnitId, period] = key.split("-");
            if (!orgUnitId || !dataSetId || !period) {
                throw Error("Cannot found org unit, dataset or period in execution");
            }
            log.debug("------------------------");
            log.debug(`Starting DataSet execution: ${key}`);

            const lastUpdatedDateTimeLocal = this.getLocalTimeFromDateString(execution.lastUpdated, timeZone);

            const dataValues = await this.getDataValues(
                [dataSetId],
                [orgUnitId],
                [period],
                lastUpdatedDateTimeLocal,
                false,
                undefined
            );

            const usersGroups = this.getUsersGroupsFromSettings(
                dataSets,
                dataSetId,
                settings,
                orgUnits,
                orgUnitId,
                period
            );

            const diffSinceLastUpdate = this.diffSinceLastUpdate(dataValues);
            if (diffSinceLastUpdate && diffSinceLastUpdate >= options.sendEmailAfterMinutes && usersGroups) {
                const dataValuesWithOldValue = await this.getOldDataValues(
                    dataValues,
                    [dataSetId],
                    [orgUnitId],
                    [period]
                );

                log.debug(
                    `${dataValuesWithOldValue.length} datavalues are going to be included in the email`
                );

                const users = await this.getUsersToNotify(dataValues, usersGroups);
                log.debug(`Sending email to ${users.length} users from groups ${usersGroups.join(", ")}`);

                const { body, subject } = await this.generateEmailTemplate(
                    dataSets,
                    dataSetId,
                    orgUnits,
                    orgUnitId,
                    dataValuesWithOldValue,
                    options,
                    period
                );

                await this.sendEmailToUsersInGroup(users, subject, body);

                await this.saveExecutionsWithEmail(
                    execution,
                    executions,
                    key,
                    options,
                    dataValues,
                    timeZone,
                    "dataSets"
                );
                log.debug("Executions saved");
            }
            log.debug(`End of execution ${key}\n`);
        });
    }

    private getUsersGroupsFromSettings(
        dataSets: DataSet[],
        dataSetId: string,
        settings: Settings,
        orgUnits: OrgUnit[],
        orgUnitId: string,
        period: string
    ) {
        const dataSetConfig = this.getDataSetConfig(dataSets, dataSetId, settings);
        const orgUnit = orgUnits.find(ou => ou.id === orgUnitId);
        const dsConfigIndex = dataSetConfig?.find(x =>
            x.monitoring.some(
                x =>
                    x.period === period &&
                    (x.orgUnit === orgUnit?.id || x.orgUnit === orgUnit?.name || x.orgUnit === orgUnit?.code)
            )
        );

        const usersGroups = dsConfigIndex?.userGroups;
        if (!usersGroups) {
            log.debug(
                `Unable to find users groups in settings for execution ${dataSetId}-${orgUnitId}-${period}`
            );
        }
        return usersGroups;
    }

    private async getOrgUnitAndDataSets(
        dataSetKeys: string[],
        settings: Settings
    ): Async<{
        orgUnits: OrgUnit[];
        dataSets: DataSet[];
    }> {
        const orgUnitIds = _(dataSetKeys)
            .map(key => {
                const allMonitoring = _(settings.dataSets[key])
                    .map(ds => ds.monitoring)
                    .flatten()
                    .value();
                const monitoring = allMonitoring.filter(m => m.enable);
                return _(monitoring)
                    .map(m => m.orgUnit)
                    .flatten()
                    .value();
            })
            .flatten()
            .value();
        log.debug("Getting datasets and org units...");
        const dataSets = await this.dataSetsRepository.getByIdentifiables(dataSetKeys);
        const orgUnits = await this.orgUnitRepository.getByIdentifiables(orgUnitIds);
        log.debug(`Found ${dataSets.length} datasets and ${orgUnits.length} org units in settings`);
        return { dataSets, orgUnits };
    }

    private async getSettings(options: OptionsUseCase): Async<Settings> {
        return this.settingsRepository.get({
            path: options.settingsPath,
        });
    }

    private async generateEmailTemplate(
        dataSets: DataSet[],
        dataSetId: string,
        orgUnits: OrgUnit[],
        orgUnitId: string,
        dataValuesWithOldValue: DataValue[],
        options: OptionsUseCase,
        period: string | undefined
    ): Async<EmailTemplate> {
        const dataSetInfo = dataSets.find(ds => ds.id === dataSetId);
        const dataSetName = dataSetInfo?.name || "";
        const orgUnit = orgUnits.find(ou => ou.id === orgUnitId);
        const orgUnitName = orgUnit?.name || "";

        const dataValuesWithDeName = dataValuesWithOldValue.map(dataValue => {
            const dataElementName = dataSetInfo?.dataSetElements.find(
                de => de.dataElement.id === dataValue.dataElement
            )?.dataElement.name;
            return {
                ...dataValue,
                name: dataElementName,
            };
        });

        const emailTemplate = await this.getEmailTemplate(options.emailDsPathTemplate);
        const dataTemplate = {
            dataSetName,
            period,
            orgUnitName,
            dataValues: dataValuesWithDeName,
        };
        return this.parseEmailContent(emailTemplate, dataTemplate);
    }

    private async saveExecutions(executions: Execution, options: OptionsUseCase): Async<void> {
        await this.executionRepository.save(executions, { path: options.executionsPath });
    }

    private async getDataSetsExecutions(
        settings: Settings,
        dataSetExecution: ExecutionInfo | undefined
    ): Async<{ dataSetExecutions: ExecutionInfo | undefined; dataSets: DataSet[]; orgUnits: OrgUnit[] }> {
        if (!settings.dataSets) return { dataSetExecutions: undefined, dataSets: [], orgUnits: [] };

        const dataSetKeys = Object.keys(settings.dataSets);
        const { dataSets, orgUnits } = await this.getOrgUnitAndDataSets(dataSetKeys, settings);

        const keys = _(dataSetKeys)
            .map(dataSetKey => {
                const dataSetDetails = settings.dataSets[dataSetKey];
                if (dataSetDetails) {
                    const allMonitoring = _(settings.dataSets[dataSetKey])
                        .map(ds => ds.monitoring)
                        .flatten()
                        .value();

                    return _(allMonitoring)
                        .filter(m => m.enable)
                        .map(monitor => {
                            const dataSet = dataSets.find(
                                dataSet =>
                                    dataSet.id === dataSetKey ||
                                    dataSet.name === dataSetKey ||
                                    dataSet.code === dataSetKey
                            );
                            if (!dataSet) {
                                throw Error(`Cannot find dataset: ${dataSetKey}`);
                            }
                            const orgUnit = orgUnits.find(
                                ou =>
                                    ou.id === monitor.orgUnit ||
                                    ou.name === monitor.orgUnit ||
                                    ou.code === monitor.orgUnit
                            );

                            if (!orgUnit) {
                                throw Error(`Cannot find org unit: ${monitor.orgUnit}`);
                            }
                            return `${dataSet.id}-${orgUnit.id}-${monitor.period}`;
                        })
                        .value();
                }
                return undefined;
            })
            .compact()
            .flatten()
            .value();

        const dataSetExecutions = _(keys)
            .map(key => {
                const storeInfo = dataSetExecution ? dataSetExecution[key] : undefined;
                return [
                    key,
                    {
                        lastDateSentEmail: storeInfo?.lastDateSentEmail || "",
                        lastUpdated: storeInfo?.lastUpdated || new Date().toISOString(),
                    },
                ] as [string, NotificationDetail];
            })
            .fromPairs()
            .value();

        return { dataSetExecutions, dataSets, orgUnits };
    }

    private async getOldDataValues(
        dataValues: DataValue[],
        dataSetIds?: string[],
        orgUnitIds?: string[],
        periods?: string[],
        dataElements?: string[]
    ): Async<DataValue[]> {
        log.debug("Getting audit datavalues...");
        const auditValues = await this.dataValuesRepository.getAudits({
            dataSetIds,
            orgUnitIds,
            periods,
            dataElements,
        });

        const dataValuesWithOldValue = dataValues.map(dv => {
            const auditValuesByDe = auditValues.filter(
                auditValue =>
                    auditValue.dataElement.id === dv.dataElement &&
                    auditValue.categoryOptionCombo.id === dv.categoryOptionCombo &&
                    auditValue.period.id === dv.period &&
                    auditValue.organisationUnit.id === dv.orgUnit
            );

            const latestAuditValue = _(auditValuesByDe).first();
            return {
                ...dv,
                oldValue: latestAuditValue?.value || "'  '",
            };
        });
        return dataValuesWithOldValue;
    }

    private getDataSetConfig(
        dataSets: DataSet[],
        dataSetId: string,
        settings: Settings
    ): MonitoringConfig[] | undefined {
        const dataSet = dataSets.find(dataSet => dataSet.id === dataSetId);
        if (!dataSet) {
            throw Error(`Cannot find dataset: ${dataSetId}`);
        }
        return (
            settings.dataSets[dataSet.id] ??
            settings.dataSets[dataSet.code] ??
            settings.dataSets[dataSet.name]
        );
    }

    private async saveExecutionsWithEmail(
        execution: NotificationDetail,
        executions: Execution,
        key: string,
        options: OptionsUseCase,
        dataValues: DataValue[],
        timeZone: string,
        typeExecution: "dataSets" | "dataElements"
    ): Async<void> {
        const lastDeUpdated = _(dataValues).maxBy(dv => dv.lastUpdated);
        if (!lastDeUpdated) return undefined;

        const lastUpdated = new Date(lastDeUpdated.lastUpdated);
        lastUpdated.setMilliseconds(lastUpdated.getMilliseconds() + 1);
        execution.lastUpdated = lastUpdated.toISOString();

        const currentDate = DateTime.local().setZone(timeZone).toISO();
        execution.lastDateSentEmail = currentDate || "";
        log.debug(`Email sent: ${execution.lastDateSentEmail}`);
        log.debug(`Next Execution Date: ${execution.lastUpdated}`);
        await this.saveExecutions(
            {
                ...executions,
                [typeExecution]: {
                    ...executions.dataElements,
                    [key]: {
                        lastDateSentEmail: execution.lastDateSentEmail,
                        lastUpdated: execution.lastUpdated,
                    },
                },
            },
            options
        );
    }

    private async sendEmailToUsersInGroup(users: User[], subject: string, body: string): Async<void> {
        await promiseMap(users, async user => {
            await this.notificationsRepository.send({
                attachments: [],
                subject,
                body: {
                    contents: body,
                    type: "html",
                },
                recipients: [user.email],
            });
        });
    }

    private async getEmailTemplate(path: Path): Async<EmailTemplate> {
        return jsonfile.readFile(path);
    }

    private async getUsersToNotify(dataValues: DataValue[], userGroup: Identifiable[]): Async<User[]> {
        const editorUsers = _(dataValues)
            .map(dv => dv.storedBy)
            .uniq()
            .value();

        const usersInGroup = await this.userRepository.getFromGroupByIdentifiables(userGroup);
        log.debug(`Excluding editors users: ${editorUsers.join(", ")}`);
        return usersInGroup.filter(user => !editorUsers.includes(user.username));
    }

    private diffSinceLastUpdate(dataValues: DataValue[]): number | undefined {
        if (dataValues.length > 0) {
            const lastDeUpdated = _(dataValues).maxBy(dv => dv.lastUpdated);
            if (lastDeUpdated) {
                const currentDate = new Date();
                const diffInMinutes = this.getDifferenceInMinutes(
                    new Date(lastDeUpdated.lastUpdated),
                    currentDate
                );
                log.debug(`${diffInMinutes} minutes has passed from the last datavalue update`);
                return diffInMinutes;
            }
        }
        return undefined;
    }

    private getDifferenceInMinutes(date1: Date, date2: Date): number {
        const end = DateTime.fromISO(date2.toISOString());
        const start = DateTime.fromISO(date1.toISOString());
        return Math.floor(end.diff(start, "minutes").minutes);
    }

    private parseEmailContent(
        emailTemplate: EmailTemplate,
        dataTemplate: {
            dataSetName: string;
            period: string | undefined;
            orgUnitName: string;
            dataValues: DataValue[];
        }
    ) {
        const subjectTemplate = _.template(emailTemplate.subject);
        const bodyTemplate = _.template(emailTemplate.body);
        const subject = subjectTemplate(dataTemplate);
        const body = bodyTemplate(dataTemplate);
        return { body, subject };
    }
}
