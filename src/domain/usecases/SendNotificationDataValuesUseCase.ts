import _ from "lodash";
import jsonfile from "jsonfile";
import log from "utils/log";
import { DataValuesRepository } from "domain/repositories/DataValuesRepository";
import { DataSetsRepository } from "domain/repositories/DataSetsRepository";
import { OrgUnitRepository } from "domain/repositories/OrgUnitRepository";
import { DataSet } from "domain/entities/DataSet";
import { OrgUnit } from "domain/entities/OrgUnit";
import { DataSetExecutionRepository } from "domain/repositories/DataSetExecutionRepository";
import { promiseMap } from "data/dhis2-utils";
import { UserRepository } from "domain/repositories/UserRepository";
import { NotificationsRepository } from "domain/repositories/NotificationsRepository";
import { DataValue } from "domain/entities/DataValue";
import { User } from "domain/entities/User";
import { Identifiable, Path } from "domain/entities/Base";
import { Async } from "domain/entities/Async";
import { SettingsRepository } from "domain/repositories/SettingsRepository";
import { MonitoringConfig, Settings } from "domain/entities/Settings";
import { TimeZoneRepository } from "domain/repositories/TimeZoneRepository";
import { DateTime } from "luxon";

type EmailTemplate = {
    subject: string;
    body: string;
};

export type NotificationDetail = {
    lastDateSentEmail: string;
    lastUpdated: string;
};

export type DataSetExecution = Record<string, NotificationDetail>;

type OptionsUseCase = {
    settingsPath: string;
    executionsPath: string;
    emailPathTemplate: string;
    sendEmailAfterMinutes: number;
    timeZone: string;
};

export class SendNotificationDataValuesUseCase {
    constructor(
        private dataSetsRepository: DataSetsRepository,
        private dataValuesRepository: DataValuesRepository,
        private orgUnitRepository: OrgUnitRepository,
        private dataSetExecutionRepository: DataSetExecutionRepository,
        private userRepository: UserRepository,
        private notificationsRepository: NotificationsRepository,
        private settingsRepository: SettingsRepository,
        private timeZoneRepository: TimeZoneRepository
    ) {}

    async execute(options: OptionsUseCase) {
        const settings = await this.getSettings(options);
        const dataSetKeys = Object.keys(settings.dataSets);
        const { timeZoneIANACode: timeZone } = options.timeZone
            ? { timeZoneIANACode: options.timeZone }
            : await this.timeZoneRepository.get();
        const currentDate = DateTime.local().setZone(timeZone).toISO();
        log.debug(`Server Date: ${currentDate} - ${timeZone}`);
        if (!currentDate) {
            throw Error(`Could not get server date from timezone ${timeZone}`);
        }
        const { dataSets, orgUnits } = await this.getOrgUnitAndDataSets(dataSetKeys, settings);
        const dataSetExecution = await this.dataSetExecutionRepository.get({
            path: options.executionsPath,
        });

        const dataSetExecutions = this.getDataSetsExecutions(settings, dataSets, orgUnits, dataSetExecution);

        if (!dataSetExecution) {
            await this.saveExecutions(dataSetExecutions, options);
        }

        await this.startExecutions(dataSetExecutions, dataSets, settings, options, orgUnits, timeZone);
    }

    private async startExecutions(
        dataSetExecutions: DataSetExecution,
        dataSets: DataSet[],
        settings: Settings,
        options: OptionsUseCase,
        orgUnits: OrgUnit[],
        timeZone: string
    ) {
        await promiseMap(_(dataSetExecutions).keys().value(), async key => {
            const execution = dataSetExecutions[key];
            if (!execution) return false;
            const [dataSetId, orgUnitId, period] = key.split("-");
            if (!orgUnitId || !dataSetId || !period) {
                throw Error("Cannot found org unit, dataset or period in execution");
            }
            log.debug("------------------------");
            log.debug(`Starting execution: ${key}`);

            const lastUpdatedDateTimeLocal = DateTime.fromISO(execution.lastUpdated, {
                zone: timeZone,
            }).toISO({
                includeOffset: false,
            });
            if (!lastUpdatedDateTimeLocal) {
                throw Error(`Cannot get local time: ${execution.lastUpdated}-${timeZone}`);
            }

            const dataValues = await this.dataValuesRepository.get({
                includeDeleted: false,
                dataSetIds: [dataSetId],
                orgUnitIds: [orgUnitId],
                periods: [period],
                // Forcing this date to act like UTC because
                // /api/dataValueSets return incorrect
                // values if you include real offset
                lastUpdated: `${lastUpdatedDateTimeLocal}Z`,
            });
            log.debug(`Getting ${dataValues.length} datavalues for execution`);

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
                    dataSetId,
                    orgUnitId,
                    period,
                    dataValues
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
                    dataSetExecutions,
                    key,
                    options,
                    dataValues,
                    timeZone
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

        const emailTemplate = await this.getEmailTemplate(options.emailPathTemplate);
        const dataTemplate = {
            dataSetName,
            period,
            orgUnitName,
            dataValues: dataValuesWithDeName,
        };
        const subjectTemplate = _.template(emailTemplate.subject);
        const bodyTemplate = _.template(emailTemplate.body);
        const subject = subjectTemplate(dataTemplate);
        const body = bodyTemplate(dataTemplate);
        return { body, subject };
    }

    private async saveExecutions(dataSetExecutions: DataSetExecution, options: OptionsUseCase): Async<void> {
        await this.dataSetExecutionRepository.save(dataSetExecutions, {
            path: options.executionsPath,
        });
    }

    private getDataSetsExecutions(
        settings: Settings,
        dataSets: DataSet[],
        orgUnits: OrgUnit[],
        dataSetStore: DataSetExecution | undefined
    ): DataSetExecution {
        const dataSetKeys = Object.keys(settings.dataSets);
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
        return _(keys)
            .map(key => {
                const storeInfo = dataSetStore ? dataSetStore[key] : undefined;
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
    }

    private async getOldDataValues(
        dataSetId: string,
        orgUnitId: string,
        period: string,
        dataValues: DataValue[]
    ): Async<DataValue[]> {
        log.debug("Getting audit datavalues...");
        const auditValues = await this.dataValuesRepository.getAudits({
            dataSetIds: [dataSetId],
            orgUnitIds: [orgUnitId],
            periods: [period],
        });

        const dataValuesWithOldValue = dataValues.map(dv => {
            const auditValuesByDe = auditValues.filter(
                auditValue =>
                    auditValue.dataElement.id === dv.dataElement &&
                    auditValue.categoryOptionCombo.id === dv.categoryOptionCombo
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
        dataSetExecutions: DataSetExecution,
        key: string,
        options: OptionsUseCase,
        dataValues: DataValue[],
        timeZone: string
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
        await this.saveExecutions({ ...dataSetExecutions, [key]: execution }, options);
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
        const diffInMilliseconds = Math.abs(date2.getTime() - date1.getTime());
        const minutes = Math.floor(((diffInMilliseconds % 86400000) % 3600000) / 60000);
        return minutes;
    }
}
