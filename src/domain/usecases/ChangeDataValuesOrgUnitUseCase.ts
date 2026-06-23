import { Logger } from "domain/logger/Logger";

import { OrgUnitRepository } from "domain/repositories/OrgUnitRepository";
import { DataSetsRepository } from "domain/repositories/DataSetsRepository";
import { DataValuesRepository, DataValuesSelector } from "domain/repositories/DataValuesRepository";

interface ChangeDataValuesOrgUnitOptions {
    dataSetId: string;
    sourceOrgUnitId: string;
    targetOrgUnitId: string;
    startDate?: string;
    endDate?: string;
    deleteSourceDataValues: boolean;
    deleteTargetDataValues: boolean;
    dryRun: boolean;
}

export class ChangeDataValuesOrgUnitUseCase {
    constructor(
        private logger: Logger,
        private orgUnitRepository: OrgUnitRepository,
        private dataSetsRepository: DataSetsRepository,
        private dataValuesRepository: DataValuesRepository
    ) {}

    async execute(options: ChangeDataValuesOrgUnitOptions) {
        const {
            dataSetId,
            sourceOrgUnitId,
            targetOrgUnitId,
            startDate,
            endDate,
            deleteSourceDataValues,
            deleteTargetDataValues,
            dryRun,
        } = options;

        const dataSetsResults = await this.dataSetsRepository.get([dataSetId]);
        const dataSet = dataSetsResults[dataSetId];

        if (!dataSet) {
            throw new Error(`Data set with ID ${dataSetId} not found.`);
        }

        const orgUnits = await this.orgUnitRepository.getByIdentifiables([sourceOrgUnitId, targetOrgUnitId]);
        if (!orgUnits.some(orgUnit => orgUnit.id === sourceOrgUnitId)) {
            throw new Error(`Source org unit with ID ${sourceOrgUnitId} not found.`);
        }
        if (!orgUnits.some(orgUnit => orgUnit.id === targetOrgUnitId)) {
            throw new Error(`Target org unit with ID ${targetOrgUnitId} not found.`);
        }

        this.logger.info(
            `Changing org unit from ${sourceOrgUnitId} to ${targetOrgUnitId} for data set: ${dataSetId}`
        );

        const dataValuesSelector: DataValuesSelector = {
            dataSetIds: [dataSetId],
            orgUnitIds: [sourceOrgUnitId],
            startDate: this.getDefaultDate(startDate, endDate, "start"),
            endDate: this.getDefaultDate(startDate, endDate, "end"),
        };

        this.logger.info(`Data values selector: ${JSON.stringify(dataValuesSelector, null, 4)}`);
        if (dryRun) {
            this.logger.info("Dry run mode enabled. No data values will be posted or deleted.");
        }

        const dataValues = await this.dataValuesRepository.get(dataValuesSelector);

        if (dataValues.length === 0) {
            this.logger.info("No data values found.");
            return;
        }

        this.logger.info(`Found ${dataValues.length} data values to change org unit.`);
        this.logger.debug(`Data values: ${JSON.stringify(dataValues, null, 4)}`);

        if (deleteTargetDataValues) {
            this.logger.info("Deleting target org unit data values...");
            const targetDataValuesSelector: DataValuesSelector = {
                dataSetIds: [dataSetId],
                orgUnitIds: [targetOrgUnitId],
                startDate: dataValuesSelector.startDate,
                endDate: dataValuesSelector.endDate,
            };
            const targetDataValues = await this.dataValuesRepository.get(targetDataValuesSelector);
            if (targetDataValues.length > 0) {
                this.logger.info(`Deleting ${targetDataValues.length} target org unit data values.`);
                await this.dataValuesRepository.delete({
                    dataValues: targetDataValues,
                    dryRun: dryRun,
                });
            } else {
                this.logger.info("No target org unit data values found to delete.");
            }
        }

        this.logger.info("Posting data values to target org unit.");
        const updatedDataValues = dataValues.map(dataValue => ({
            ...dataValue,
            orgUnit: targetOrgUnitId,
        }));

        await this.dataValuesRepository.post({
            dataValues: updatedDataValues,
            dryRun: dryRun,
        });

        if (deleteSourceDataValues) {
            this.logger.info("Deleting source org unit data values...");
            await this.dataValuesRepository.delete({
                dataValues: dataValues,
                dryRun: dryRun,
            });
        }
    }

    private getDefaultDate(
        startDate: string | undefined,
        endDate: string | undefined,
        type: "start" | "end"
    ): string {
        if (type === "start") {
            return startDate || "1970-01-01";
        } else {
            const now = new Date();
            const endOfCurrentYear = now.getFullYear();
            if (!startDate) {
                return `${endOfCurrentYear}-12-31`;
            } else {
                const startYear = new Date(startDate).getFullYear();
                const defaultEndYear = endOfCurrentYear < startYear ? startYear : endOfCurrentYear;
                return endDate || `${defaultEndYear}-12-31`;
            }
        }
    }
}
