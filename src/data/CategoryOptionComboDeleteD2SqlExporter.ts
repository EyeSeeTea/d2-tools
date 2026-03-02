import { Id } from "domain/entities/Base";
import { CategoryOptionComboDeleteExporter } from "domain/repositories/CategoryOptionComboDeleteExporter";
import { writeFileSync } from "fs";
import _ from "lodash";
import logger from "utils/log";
import { deleteCategoryOptionComboBatchSqlTemplate } from "./CategoryOptionComboDeleteSqlTemplate";

const renderDeleteCategoryOptionComboBatchSql = _.template(deleteCategoryOptionComboBatchSqlTemplate);

export class CategoryOptionComboDeleteD2SqlExporter implements CategoryOptionComboDeleteExporter {
    constructor(private pathToFile: string) {}

    exportDeleteScript(cocIds: string[]): void {
        const sqlQuery = this.createDeleteUnusedCategoryOptionCombosSQL(cocIds, { batchSize: 500 });
        this.writeToDisk(sqlQuery);
    }

    private createDeleteUnusedCategoryOptionCombosSQL(ids: Id[], options: { batchSize: number }): string {
        const { batchSize } = options;
        const batches = _.chunk(ids, batchSize);

        const batchStatements = batches.map(batch => {
            const valuesClause = batch.map(uid => `('${uid}')`).join(",\n  ");

            return renderDeleteCategoryOptionComboBatchSql({ valuesClause });
        });

        return ["BEGIN;", ...batchStatements, "COMMIT;"].join("\n");
    }

    private writeToDisk(sqlScript: string): void {
        const fileName = `${this.pathToFile}.sql`;
        writeFileSync(fileName, sqlScript);
        logger.info(`SQL generated: ${fileName}`);
        logger.info(`You can execute the sql with d2-docker: d2-docker run-sql ${fileName}`);
    }
}
