import _ from "lodash";

import { Path } from "domain/entities/Base";
import { DataValuesRepository } from "domain/repositories/DataValuesRepository";
import { Id } from "types/d2-api";
import { DataValue, DataValuesMetadata } from "domain/entities/DataValue";
import log from "utils/log";
import { DataSetsRepository } from "domain/repositories/DataSetsRepository";
import { DataSet } from "domain/entities/DataSet";
import { DanglingDataValuesRepository } from "domain/repositories/DanglingDataValuesRepository";
import { Maybe } from "utils/ts-utils";
import { DanglingDataValue } from "domain/entities/DanglingDataValue";
import { NotificationsRepository } from "domain/repositories/NotificationsRepository";

interface GetDanglingValuesOptions {
    outputFile: Path;
    notify?: Email[];

    dataSetIds?: Id[];
    orgUnitIds?: Id[];
    periods?: string[];
    dataElementGroupIds?: Id[];
    orgUnitGroupIds?: Id[];
    includeOrgUnitChildren: boolean;
    children?: boolean;
    startDate?: string;
    endDate?: string;
}

export class GetDanglingValuesUseCase {
    constructor(
        private dataSetsRepository: DataSetsRepository,
        private dataValuesRepository: DataValuesRepository,
        private danglingDataValuesRepository: DanglingDataValuesRepository,
        private notificationsRepository: NotificationsRepository
    ) {}

    async execute(options: GetDanglingValuesOptions) {
        log.debug(`Get data values`);
        const dataValues = await this.getDataValues(options);
        log.debug(`Data values read from DHIS2 instance: ${dataValues.length}`);

        log.debug(`Get metadata associated to data values`);
        const dataValuesMetadata = await this.dataValuesRepository.getMetadata({ dataValues });
        const danglingValues = await this.getDanglingDataValues(dataValues, dataValuesMetadata);

        log.debug(`Dangling data values detected: ${danglingValues.length}`);

        await this.danglingDataValuesRepository.save({
            dataValues: danglingValues,
            dataValuesMetadata,
            outputFile: options.outputFile,
        });

        await this.notifyReport(danglingValues, options);
    }

    private async getDataValues(options: GetDanglingValuesOptions) {
        return await this.dataValuesRepository.get({
            ...options,
            includeDeleted: false,
            children: options.includeOrgUnitChildren,
        });
    }

    private async notifyReport(danglingValues: DanglingDataValue[], options: GetDanglingValuesOptions) {
        if (!options.notify) return;

        const counts = {
            all: danglingValues.length,
            nonZero: _(danglingValues)
                .filter(({ dataValue: dv }) => dv.value !== "" && dv.value !== "0")
                .size(),
        };

        log.debug(`Send report to: ${options.notify.join(", ")}`);

        await this.notificationsRepository.send({
            recipients: options.notify,
            subject: `Dangling values report`,
            body: `Dangling values: ${counts.all} (non-zero: ${counts.nonZero})`,
            attachments: [{ type: "file", file: options.outputFile }],
        });
    }

    private async getDanglingDataValues(dataValues: DataValue[], dataValuesMetadata: DataValuesMetadata) {
        const dataValuesData = await this.getDataValuesData(dataValues);

        log.debug(`Analyze dangling data values`);
        return _(dataValues)
            .map((dataValue): Maybe<DanglingDataValue> => {
                const dataSetsDataForOrgUnit = dataValuesData.dataSetsByOrgUnitId[dataValue.orgUnit] || [];

                const isDataValueValid = _(dataSetsDataForOrgUnit).some(data =>
                    _(getValidationChecks(data, dataValue)).values().every()
                );

                if (_.isEmpty(dataSetsDataForOrgUnit)) {
                    return {
                        dataValue,
                        dataSet: undefined,
                        errors: ["No data set assigned to this org unit"],
                    };
                } else if (isDataValueValid) {
                    return undefined;
                } else {
                    return this.getDanglingDataValue(dataValue, dataSetsDataForOrgUnit, dataValuesMetadata);
                }
            })
            .compact()
            .value();
    }

    private getDanglingDataValue(
        dataValue: DataValue,
        dataSetsDataForOrgUnit: DataSetData[],
        dataValuesMetadata: DataValuesMetadata
    ): Maybe<DanglingDataValue> {
        // There were some invalid data values, infer the nearest data set
        const validations = dataSetsDataForOrgUnit.map((data): DataValueValidation => {
            const checks = getValidationChecks(data, dataValue);
            const values = [checks.disaggregation, checks.orgUnit, checks.dataElementSet, checks.period];
            const checksDistance = _.sum(values.map(isValid => (isValid ? 0 : 1)));

            // A very simple heuristic to break the tie between data sets with the same distance:
            // check if the attribute option combo is present in the data set name (suitable for
            // project-monitoring-app projects).
            const aocId = dataValue.attributeOptionCombo;
            const aocName = dataValuesMetadata.categoryOptionCombos[aocId]?.name.toLowerCase();
            const aocDistance = aocName && data.dataSet.name.toLowerCase().includes(aocName) ? 0 : 0.5;

            const distance = checksDistance + aocDistance;

            return {
                dataValue,
                closestDataSet: { dataSet: data.dataSet, distance, checks: checks },
            };
        });

        const closestValidation = _.minBy(validations, v => v.closestDataSet.distance);
        const closestDistance = closestValidation?.closestDataSet.distance;

        if (closestValidation && closestDistance) {
            const errors = _(closestValidation.closestDataSet.checks)
                .pickBy(isCheckValid => !isCheckValid)
                .keys()
                .sort()
                .value();
            return { dataValue, dataSet: closestValidation.closestDataSet.dataSet, errors };
        } else {
            return undefined;
        }
    }

    private async getDataValuesData(dataValues: DataValue[]): Promise<DataValuesData> {
        const dataSets = await this.dataSetsRepository.get();

        log.debug(`Building intermediate data for data sets`);

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

        const dataSetsByOrgUnitId: Record<OrgUnitId, DataSetData[]> = _(dataSetsData)
            .flatMap(data => data.dataSet.organisationUnits.map(ou => ({ orgUnitId: ou.id, data })))
            .groupBy(obj => obj.orgUnitId)
            .mapValues(objs =>
                _(objs)
                    .map(obj => obj.data)
                    .uniqBy(obj => obj.dataSet.id)
                    .value()
            )
            .value();

        return { dataValues, dataSetsData, dataSetsByOrgUnitId };
    }
}

type Email = string;
type OrgUnitId = Id;
type DataElementSetId = string; // dataElementId.cocId

interface DataValuesData {
    dataValues: DataValue[];
    dataSetsData: DataSetData[];
    dataSetsByOrgUnitId: Record<OrgUnitId, DataSetData[]>;
}

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
    dataElementSet: boolean; // `${dataElementId}.$categoryOptionCombo}`
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

function getValidationChecks(data: DataSetData, dataValue: DataValue): Checks {
    return {
        disaggregation: data.disaggregationCocIds.has(dataValue.attributeOptionCombo),
        orgUnit: data.orgUnitIds.has(dataValue.orgUnit),
        dataElementSet: data.dataElementSetIds.has(
            [dataValue.dataElement, dataValue.categoryOptionCombo].join(".")
        ),
        period: _(data.periods).isEmpty() || data.periods.has(dataValue.period),
    };
}
