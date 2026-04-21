import fs from "fs";

import _ from "lodash";
import { Logger } from "domain/logger/Logger";

import { DataValuesRepository } from "domain/repositories/DataValuesRepository";
import { OrgUnitRepository } from "domain/repositories/OrgUnitRepository";
import { DataValue } from "domain/entities/DataValue";

interface BulkDeleteDataValuesOptions {
    batchSize: number;
    backupFolder?: string;
    dryRun: boolean;
}

export class BulkDeleteDataValuesUseCase {
    private deChunkSize = 200;
    private timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    constructor(
        private logger: Logger,
        private orgUnitRepository: OrgUnitRepository,
        private dataValuesRepository: DataValuesRepository
    ) {}

    async execute(dataElementIds: string[], options: BulkDeleteDataValuesOptions) {
        const { backupFolder, dryRun } = options;
        if (backupFolder) this.validatePath(backupFolder);

        const uniqueDataElementIds = _.uniq(dataElementIds);

        this.logger.info(`Data elements to delete count: ${uniqueDataElementIds.length}`);

        const rootOrgUnit = await this.orgUnitRepository.getRoot();
        const deGroups = _.chunk(uniqueDataElementIds, this.deChunkSize);

        let backupIndex = 1;
        const lastIndex = deGroups.length - 1;
        for (const [index, deIds] of deGroups.entries()) {
            this.logger.info(
                `Processing data element group ${index + 1} of ${deGroups.length} (group size: ${
                    deIds.length
                })`
            );

            const dataValuesOptions: DataValuesGetOptions = {
                dataElements: deIds,
                orgUnitIds: [rootOrgUnit.id],
                children: true,
                lastUpdated: "1970-01-01",
                limit: options.batchSize,
            };

            backupIndex = await this.deleteDataValuesRecursively(
                dataValuesOptions,
                backupIndex,
                index === lastIndex,
                dryRun,
                backupFolder
            );
        }
    }

    private async deleteDataValuesRecursively(
        dataValuesOptions: DataValuesGetOptions,
        backupIndex: number,
        lastDEsBatch = false,
        dryRun = false,
        backupFolder?: string
    ): Promise<number> {
        const dataValues = await this.dataValuesRepository.get(dataValuesOptions);

        if (dataValues.length === 0) {
            if (lastDEsBatch) {
                const message =
                    backupIndex === 1
                        ? "No data values found to delete."
                        : "All data values have been deleted.";
                this.logger.info(message);
            }
            return backupIndex;
        }

        this.logger.info(`Data values fetched for deletion in batch ${backupIndex}: ${dataValues.length}`);
        if (backupFolder) this.backupDataValues(backupFolder, dataValues, backupIndex);
        try {
            await this.dataValuesRepository.delete({
                dataValues: dataValues,
                dryRun: dryRun,
            });
        } catch (error) {
            throw new Error(
                `Error deleting data values in batch ${backupIndex}: ${(error as Error).message}`
            );
        }

        if (dryRun) {
            this.logger.info("Dry run mode - stopping after first batch.");
            return backupIndex + 1;
        }
        return await this.deleteDataValuesRecursively(
            dataValuesOptions,
            backupIndex + 1,
            lastDEsBatch,
            dryRun,
            backupFolder
        );
    }

    private backupDataValues(backupFolder: string, dataValues: DataValue[], batch: number) {
        const backupFilePath = `${backupFolder}/bulk-delete-backup-${batch}-${this.timestamp}.json`;
        this.logger.info(`Backing up data values to be deleted in file: ${backupFilePath}`);
        fs.writeFileSync(backupFilePath, JSON.stringify(dataValues, null, 2));
    }

    private validatePath(path: string) {
        if (!fs.existsSync(path) || !fs.statSync(path).isDirectory()) {
            throw new Error(`Backup path invalid or not a folder: ${path}`);
        }
    }
}

interface DataValuesGetOptions {
    dataElements: string[];
    orgUnitIds: string[];
    children: boolean;
    lastUpdated: string;
    limit: number;
}
