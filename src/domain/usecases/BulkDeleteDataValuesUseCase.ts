import fs from "fs";

import _ from "lodash";
import log from "utils/log";

import { BulkDeleteDEsRepository } from "domain/repositories/BulkDeleteDEsRepository";
import { DataValuesRepository } from "domain/repositories/DataValuesRepository";
import { OrgUnitRepository } from "domain/repositories/OrgUnitRepository";
import { DataValue } from "domain/entities/DataValue";


interface BulkDeleteDataValuesOptions {
    dataElementsFile: string;
    limit: number;
    backupFolder?: string;
}

export class BulkDeleteDataValuesUseCase {
    constructor(
        private bulkDeleteRepository: BulkDeleteDEsRepository,
        private orgUnitRepository: OrgUnitRepository,
        private dataValuesRepository: DataValuesRepository
    ) {}

    async execute(options: BulkDeleteDataValuesOptions) {
        const { backupFolder } = options;
        if (backupFolder) this.validatePath(backupFolder);

        const dataElementIds = await this.bulkDeleteRepository.getDEsToDelete(options.dataElementsFile)
            .then(ids => {
                if (ids.length === 0) {
                    log.error("CSV empty or missing headers.");
                    process.exit(0);
                }
                return _.uniq(ids);
            });
        log.info(`Data elements to delete count: ${dataElementIds.length}`);

        const rootOrgUnit = await this.orgUnitRepository.getRoot();
        const deChunks = _.chunk(dataElementIds, 200);

        let backupIndex = 1;
        const lastIndex = deChunks.length - 1;
        for (const [index, dataElements] of deChunks.entries()) {
            log.info(`Processing data element chunk ${index + 1}/${deChunks.length} (${dataElements.length})`);

            const dataValuesOptions: DataValuesDeleteOptions = {
                dataElements,
                orgUnitIds: [rootOrgUnit.id],
                children: true,
                lastUpdated: "1970-01-01",
                limit: options.limit,
            };

            backupIndex = await this.deleteDataValuesRecursively(dataValuesOptions, backupFolder, backupIndex, index === lastIndex);
        }
    }

    private async deleteDataValuesRecursively(
        dataValuesOptions: DataValuesDeleteOptions,
        backupFolder: string | undefined,
        batchIndex: number,
        lastDEsBatch = false,
    ): Promise<number> {
        const dataValues = await this.dataValuesRepository.get(dataValuesOptions);

        if (dataValues.length === 0) {
            if (lastDEsBatch) {
                const message = batchIndex === 1
                    ? "No data values found to delete."
                    : "All data values have been deleted.";
                log.info(message);
            }
            return batchIndex;
        }

        log.info(`Data values fetched for deletion in batch ${batchIndex}: ${dataValues.length}`);
        this.backupDataValues(dataValues, batchIndex, backupFolder);

        try {
            await this.dataValuesRepository.delete({
                dataValues: dataValues,
            });
        } catch (error) {
            log.error(`Error deleting data values in batch ${batchIndex}`);
            process.exit(1);
        }

        return await this.deleteDataValuesRecursively(dataValuesOptions, backupFolder, batchIndex + 1);
    }

    private backupDataValues(dataValues: DataValue[], batch: number, backupFolder: string | undefined) {
        if (!backupFolder) return;

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const backupFilePath = `${backupFolder}/bulk-delete-backup-${batch}-${timestamp}.json`;
        log.info(`Backing up data values to be deleted in file: ${backupFilePath}`);
        fs.writeFileSync(backupFilePath, JSON.stringify(dataValues, null, 2));
    }

    private validatePath(path: string) {
        if (!fs.existsSync(path) || !fs.statSync(path).isDirectory()) {
            log.error(`Backup path invalid or not a folder: ${path}`);
            process.exit(1);
        }
    }
}

interface DataValuesDeleteOptions {
    dataElements: string[];
    orgUnitIds: string[];
    children: boolean;
    lastUpdated: string;
    limit: number;
}