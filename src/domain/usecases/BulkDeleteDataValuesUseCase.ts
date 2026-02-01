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
    dryRun: boolean;
}

export class BulkDeleteDataValuesUseCase {
    private dryRun = false;
    private backupFolder: string | undefined;
    private deChunkSize = 200;

    constructor(
        private bulkDeleteRepository: BulkDeleteDEsRepository,
        private orgUnitRepository: OrgUnitRepository,
        private dataValuesRepository: DataValuesRepository
    ) {}

    async execute(options: BulkDeleteDataValuesOptions) {
        const { backupFolder, dryRun } = options;
        if (backupFolder) this.validatePath(backupFolder);

        this.dryRun = dryRun;
        this.backupFolder = backupFolder;

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
        const deChunks = _.chunk(dataElementIds, this.deChunkSize);

        let backupIndex = 1;
        const lastIndex = deChunks.length - 1;
        for (const [index, dataElements] of deChunks.entries()) {
            log.info(`Processing data element chunk ${index + 1}/${deChunks.length} (${dataElements.length})`);

            const dataValuesOptions: DataValuesGetOptions = {
                dataElements,
                orgUnitIds: [rootOrgUnit.id],
                children: true,
                lastUpdated: "1970-01-01",
                limit: options.limit,
            };


            backupIndex = await this.deleteDataValuesRecursively(dataValuesOptions, backupIndex, index === lastIndex);
        }
    }

    private async deleteDataValuesRecursively(
        dataValuesOptions: DataValuesGetOptions,
        backupIndex: number,
        lastDEsBatch = false,
    ): Promise<number> {
        const dataValues = await this.dataValuesRepository.get(dataValuesOptions);

        if (dataValues.length === 0) {
            if (lastDEsBatch) {
                const message = backupIndex === 1
                    ? "No data values found to delete."
                    : "All data values have been deleted.";
                log.info(message);
            }
            return backupIndex;
        }

        log.info(`Data values fetched for deletion in batch ${backupIndex}: ${dataValues.length}`);
        this.backupDataValues(dataValues, backupIndex);
        try {
            await this.dataValuesRepository.delete({
                dataValues: dataValues,
                dryRun: this.dryRun,
            });
        } catch (error) {
            log.error(`Error deleting data values in batch ${backupIndex}: ${(error as Error).message}`);
            process.exit(1);
        }

        if (this.dryRun) {
            log.info("Dry run mode - stopping after first batch.");
            return backupIndex + 1;
        }
        return await this.deleteDataValuesRecursively(dataValuesOptions, backupIndex + 1, lastDEsBatch);
    }

    private backupDataValues(dataValues: DataValue[], batch: number) {
        if (!this.backupFolder) return;
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const backupFilePath = `${this.backupFolder}/bulk-delete-backup-${batch}-${timestamp}.json`;
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

interface DataValuesGetOptions {
    dataElements: string[];
    orgUnitIds: string[];
    children: boolean;
    lastUpdated: string;
    limit: number;
}