import _ from "lodash";

import { Path } from "domain/entities/Base";
import { DataValuesRepository } from "domain/repositories/DataValuesRepository";
import { Id } from "types/d2-api";
import { DataValue } from "domain/entities/DataValue";
import log from "utils/log";
import { DataSetsRepository } from "domain/repositories/DataSetsRepository";
import { DataSet } from "domain/entities/DataSet";
import { DanglingDataValuesRepository } from "domain/repositories/DanglingDataValuesRepository";
import { Maybe } from "utils/ts-utils";
import { DanglingDataValue } from "domain/entities/DanglingDataValue";
import { NotificationsRepository } from "domain/repositories/NotificationsRepository";

interface Options {
    outputFile: Path;
    dataSetIds?: Id[];
    orgUnitIds?: Id[];
    periods?: string[];
    dataElementGroupIds?: Id[];
    orgUnitGroupIds?: Id[];
    includeOrgUnitChildren: boolean;
    children?: boolean;
    startDate?: string;
    endDate?: string;
    notify?: Email[];
}

type Email = string;

type DataElementSetId = string; // dataElementId.cocId

interface DataSetData {
    dataSet: DataSet;
    orgUnitIds: Set<Id>;
    dataElementSetIds: Set<DataElementSetId>;
    periods: Set<string>;
    disaggregationCocIds: Set<Id>;
}

interface Checks {
    disaggregation: boolean;
    orgUnit: boolean;
    dataElementSet: boolean; // dataElement + categoryOptionCombo
    period: boolean;
}

interface DataValueValidation {
    dataValue: DataValue;
    closestDataSet: {
        dataSet: DataSet;
        distance: number;
        checks: Checks;
    };
}

export class GetDanglingValuesUseCase {
    constructor(
        private dataSetsRepository: DataSetsRepository,
        private dataValuesRepository: DataValuesRepository,
        private danglingDataValuesRepository: DanglingDataValuesRepository,
        private notificationsRepository: NotificationsRepository
    ) {}

    async execute(options: Options) {
        this.logOptions(options);

        const dataValues = await this.dataValuesRepository.get({
            ...options,
            includeDeleted: false,
            children: options.includeOrgUnitChildren,
        });
        log.debug(`Data values read from DHIS2 instance: ${dataValues.length}`);

        log.debug(`Get metadata associated to data vales`);

        const dataValuesMetadata = await this.dataValuesRepository.getMetadata({ dataValues });

        const dataSets = await this.dataSetsRepository.get();

        // Build an intermediate structure to perform faster dataValue/dataSet inclusion checks.

        const dataSetsData = dataSets.map((dataSet): DataSetData => {
            return {
                dataSet,
                orgUnitIds: new Set(dataSet.organisationUnits.map(ou => ou.id)),
                dataElementSetIds: new Set(
                    _(dataSet.dataSetElements)
                        .flatMap(dse => {
                            const cocIds = dse.categoryCombo?.categoryOptionCombos.map(coc => coc.id) || [];
                            return cocIds.map(cocId => [dse.dataElement.id, cocId].join("."));
                        })
                        .value()
                ),
                periods: new Set(dataSet.dataInputPeriods.map(dip => dip.period.id)),
                disaggregationCocIds: new Set(dataSet.categoryCombo.categoryOptionCombos.map(coc => coc.id)),
            };
        });

        function getChecks(data: DataSetData, dataValue: DataValue): Checks {
            return {
                disaggregation: data.disaggregationCocIds.has(dataValue.attributeOptionCombo),
                orgUnit: data.orgUnitIds.has(dataValue.orgUnit),
                dataElementSet: data.dataElementSetIds.has(
                    [dataValue.dataElement, dataValue.categoryOptionCombo].join(".")
                ),
                period: _(data.periods).isEmpty() || data.periods.has(dataValue.period),
            };
        }

        // Build a mapping of org unit and data sets to perform a first filter (increases performance)
        type OrgUnitId = Id;

        log.debug(`Building intermediate data for data sets`);
        const dataSetsByOrgUnitId: Record<OrgUnitId, DataSetData[]> = _(dataSetsData)
            .flatMap(data => data.dataSet.organisationUnits.map(ou => ({ orgUnitId: ou.id, data })))
            .groupBy(o => o.orgUnitId)
            .mapValues(os =>
                _(os)
                    .map(o => o.data)
                    .uniqBy(o => o.dataSet.id)
                    .value()
            )
            .value();

        log.debug(`Analyze dangling data values`);
        // Get the validations of the shortest distance from dataSet to dataValue
        const danglingValues = _(dataValues)
            .map((dataValue): Maybe<DanglingDataValue> => {
                // Do a first filter by org unit to increase performance
                const dataSetsWithMatchingOrgUnit = dataSetsByOrgUnitId[dataValue.orgUnit] || [];

                if (_.isEmpty(dataSetsWithMatchingOrgUnit))
                    return {
                        dataValue,
                        dataSet: undefined,
                        errors: ["No data set assigned to this org unit"],
                    };

                const isDataValueValid = _(dataSetsWithMatchingOrgUnit).some(data =>
                    _(getChecks(data, dataValue)).values().every()
                );
                if (isDataValueValid) return undefined;

                // There are some invalid dataValues, calculate the validations and get the closest one
                const validations = dataSetsWithMatchingOrgUnit.map(data => {
                    const checks = getChecks(data, dataValue);

                    const distance = _([
                        checks.disaggregation,
                        checks.orgUnit,
                        checks.dataElementSet,
                        checks.period,
                    ])
                        .map(isValid => (isValid ? 0 : 1))
                        .sum();

                    const validation: DataValueValidation = {
                        dataValue,
                        closestDataSet: { dataSet: data.dataSet, distance, checks: checks },
                    };

                    return validation;
                });

                const closestValidation = _.minBy(validations, v => v.closestDataSet.distance);
                const closestDistance = closestValidation?.closestDataSet.distance;

                if (!closestValidation) {
                    throw new Error("internal error");
                } else if (closestDistance !== undefined && closestDistance > 0) {
                    const errors = _(closestValidation.closestDataSet.checks)
                        .pickBy(isCheckValid => !isCheckValid)
                        .keys()
                        .sort()
                        .value();

                    return { dataValue, dataSet: closestValidation.closestDataSet.dataSet, errors };
                } else {
                    return undefined;
                }
            })
            .compact()
            .value();

        log.debug(`Dangling data values: ${danglingValues.length}`);

        await this.danglingDataValuesRepository.save({
            dataValues: danglingValues,
            dataValuesMetadata,
            outputFile: options.outputFile,
        });

        if (options.notify) {
            log.debug(`Send report to: ${options.notify.join(", ")}`);

            await this.notificationsRepository.send({
                recipients: options.notify,
                subject: `[platform] Dangling values report`,
                body: "",
                attachments: [{ type: "file", file: options.outputFile }],
            });
        }
    }

    private logOptions(options: Options) {
        log.debug(`Options: ${JSON.stringify(options, null, 4)}`);
    }

    /*
    private writeBackupFile(dataValues: DataValue[], options: Options) {
        const payloadBackup = { dataValues };
        const jsonBackup = JSON.stringify(payloadBackup, null, 4);
        const backupFile = options.outputFile + "-backup.json";
        fs.writeFileSync(backupFile, jsonBackup);
        log.info(`Written backup: ${backupFile}`);
    }

    private writePayloadFile(updates: Update[], options: Options) {
        const { outputFile, url } = options;
        const dataValuesToPost = updates.map(update => update.dataValueUpdated);
        const payload = { dataValues: dataValuesToPost };
        const json = JSON.stringify(payload, null, 4);

        fs.writeFileSync(outputFile, json);
        log.info(`Written payload (${dataValuesToPost.length} data values): ${outputFile}`);
        const postUrl = `${url}/api/dataValueSets?force=true&skipAudit=true`;

        log.info(`Post example: curl -H 'Content-Type: application/json' -d@'${outputFile}' '${postUrl}'`);
    }
    */
}
