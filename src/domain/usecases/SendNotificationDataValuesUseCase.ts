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
import { Path } from "domain/entities/Base";
import { Async } from "domain/entities/Async";
import { Settings, SettingsRepository } from "domain/repositories/SettingsRepository";

type EmailTemplate = {
    subject: string;
    body: string;
};

export type NotificationDetail = {
    lastDateSentEmail: string;
    lastUpdated: string;
};

export type NotificationStore = Record<string, NotificationDetail>;

type OptionsUseCase = {
    storage: string;
    jsonSettingsPath: string;
    jsonExecutionsPath: string;
    dataStoreNameSpace: string;
    emailPathTemplate: string;
    sendEmailAfterMinutes: number;
};

export class SendNotificationDataValuesUseCase {
    constructor(
        private dataSetsRepository: DataSetsRepository,
        private dataValuesRepository: DataValuesRepository,
        private orgUnitRepository: OrgUnitRepository,
        private dataSetStoreRepository: DataSetExecutionRepository,
        private userRepository: UserRepository,
        private notificationsRepository: NotificationsRepository,
        private settingsRepository: SettingsRepository
    ) {}

    async execute(options: OptionsUseCase) {
        const settings = await this.settingsRepository.get({
            namespace: options.dataStoreNameSpace,
            path: options.jsonSettingsPath,
        });
        const dataSetKeys = Object.keys(settings.dataSets);

        const orgUnitIds = _(dataSetKeys)
            .map(key => {
                const monitoring = settings.dataSets[key]?.monitoring.filter(m => m.enable);
                return _(monitoring)
                    .map(m => m.orgUnit)
                    .flatten()
                    .value();
            })
            .flatten()
            .value();

        const dataSets = await this.dataSetsRepository.getBy(dataSetKeys);
        const orgUnits = await this.orgUnitRepository.get(orgUnitIds);
        const dataSetStore = await this.dataSetStoreRepository.get({
            path: options.jsonExecutionsPath,
            namespace: options.dataStoreNameSpace,
        });

        const dataSetExecutions = this.getDataSetsExecutions(
            dataSetKeys,
            settings,
            dataSets,
            orgUnits,
            dataSetStore
        );

        if (_.isEmpty(dataSetStore)) {
            await this.saveExecutions(dataSetExecutions, options);
        }

        await promiseMap(_(dataSetExecutions).keys().value(), async key => {
            const execution = dataSetExecutions[key];
            if (!execution) return false;
            const [dataSetId, orgUnitId, period] = key.split("-");
            if (!orgUnitId || !dataSetId || !period) {
                throw Error("Cannot found org unit, dataset or period in execution");
            }

            const dataValues = await this.dataValuesRepository.get({
                includeDeleted: false,
                dataSetIds: [dataSetId],
                orgUnitIds: [orgUnitId],
                periods: [period],
                lastUpdated: execution.lastUpdated,
            });
            log.debug(`Getting ${dataValues.length} datavalues for execution: ${key}`);

            const userGroup = this.getDataSetConfig(dataSets, dataSetId, settings)?.userGroup;
            if (this.diffSinceLastUpdate(dataValues) >= options.sendEmailAfterMinutes && userGroup) {
                const dataValuesWithOldValue = await this.getOldDataValues(
                    dataSetId,
                    orgUnitId,
                    period,
                    dataValues
                );

                const users = await this.getUsersToNotify(dataValues, userGroup);
                log.debug(`Sending email to ${users.length} users in group ${userGroup}`);

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

                await this.saveExecutionsWithEmail(execution, dataSetExecutions, key, options);
                log.debug(`Executions saved: ${key}`);
            }
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
    ) {
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

    private async saveExecutions(dataSetExecutions: NotificationStore, options: OptionsUseCase) {
        await this.dataSetStoreRepository.save(dataSetExecutions, {
            path: options.jsonExecutionsPath,
            namespace: options.dataStoreNameSpace,
        });
    }

    private getDataSetsExecutions(
        dataSetKeys: string[],
        settings: Settings,
        dataSets: DataSet[],
        orgUnits: OrgUnit[],
        dataSetStore: NotificationStore | undefined
    ) {
        const keys = _(dataSetKeys)
            .map(dataSetKey => {
                const dataSetDetails = settings.dataSets[dataSetKey];
                if (dataSetDetails) {
                    return _(dataSetDetails.monitoring)
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

        const currentDate = new Date().toISOString();
        const dataSetExecutions = keys.reduce<NotificationStore>((acum, key) => {
            const storeInfo = dataSetStore ? dataSetStore[key] : undefined;
            return {
                ...acum,
                [key]: {
                    lastDateSentEmail: storeInfo?.lastDateSentEmail || "",
                    lastUpdated: storeInfo?.lastUpdated || currentDate,
                },
            };
        }, {});
        return dataSetExecutions;
    }

    private async getOldDataValues(
        dataSetId: string,
        orgUnitId: string,
        period: string,
        dataValues: DataValue[]
    ) {
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

    private getDataSetConfig(dataSets: DataSet[], dataSetId: string, settings: Settings) {
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
        dataSetExecutions: NotificationStore,
        key: string,
        options: OptionsUseCase
    ) {
        const dateEmailSent = new Date().toISOString();
        execution.lastDateSentEmail = dateEmailSent;
        execution.lastUpdated = dateEmailSent;
        log.debug(`Email sent ${dateEmailSent}`);

        await this.saveExecutions(
            {
                ...dataSetExecutions,
                [key]: {
                    ...execution,
                },
            },
            options
        );
    }

    private async sendEmailToUsersInGroup(users: User[], subject: string, body: string) {
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

    private async getUsersToNotify(dataValues: DataValue[], userGroup: string) {
        const editorUsers = _(dataValues)
            .map(dv => dv.storedBy)
            .uniq()
            .value();

        const usersInGroup = await this.userRepository.getFromGroup([userGroup]);
        return usersInGroup.filter(user => !editorUsers.includes(user.username));
    }

    private diffSinceLastUpdate(dataValues: DataValue[]) {
        if (dataValues.length > 0) {
            const lastDeUpdated = _(dataValues).maxBy(dv => dv.lastUpdated);
            if (lastDeUpdated) {
                const currentDate = new Date();
                const diffInMinutes = this.getDifferenceInMinutes(
                    new Date(lastDeUpdated.lastUpdated),
                    currentDate
                );
                return diffInMinutes;
            }
        }
        return -1;
    }

    private getDifferenceInMinutes(date1: Date, date2: Date) {
        const diffInMilliseconds = Math.abs(date2.getTime() - date1.getTime());
        const minutes = Math.floor(((diffInMilliseconds % 86400000) % 3600000) / 60000);
        return minutes;
    }
}
