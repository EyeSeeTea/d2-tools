import { Id } from "domain/entities/Base";
import { CategoryOptionComboDeleteExporter } from "domain/repositories/CategoryOptionComboDeleteExporter";
import _ from "lodash";
import { deleteCategoryOptionComboBatchSqlTemplate } from "./CategoryOptionComboDeleteSqlTemplate";

const renderDeleteCategoryOptionComboBatchSql = _.template(deleteCategoryOptionComboBatchSqlTemplate);

export class CategoryOptionComboDeleteD2SqlExporter implements CategoryOptionComboDeleteExporter {
    exportDeleteScript(cocIds: Id[]): string {
        const sqlQuery = this.createDeleteUnusedCategoryOptionCombosSQL(cocIds, { batchSize: 500 });
        return sqlQuery;
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
}
