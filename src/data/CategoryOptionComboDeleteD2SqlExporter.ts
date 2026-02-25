import { Id } from "domain/entities/Base";
import { CategoryOptionComboDeleteExporter } from "domain/repositories/CategoryOptionComboDeleteExporter";
import { writeFileSync } from "fs";
import logger from "utils/log";

export class CategoryOptionComboDeleteD2SqlExporter implements CategoryOptionComboDeleteExporter {
    constructor(private pathToFile: string) {}

    exportDeleteScript(cocIds: string[]): void {
        const sqlQuery = this.createDeleteUnusedCategoryOptionCombosSQL(cocIds);
        this.writeToDisk(sqlQuery);
    }

    private createDeleteUnusedCategoryOptionCombosSQL(ids: Id[], batchSize: number = 500): string {
        const batches = Array.from({ length: Math.ceil(ids.length / batchSize) }, (_, i) =>
            ids.slice(i * batchSize, (i + 1) * batchSize)
        );

        const batchStatements = batches.map(batch => {
            const valuesClause = batch.map(uid => `('${uid}')`).join(",\n  ");

            return `CREATE TEMP TABLE temp_uids_batch (uid VARCHAR(11));
INSERT INTO temp_uids_batch (uid) VALUES
  ${valuesClause};

CREATE TEMP TABLE temp_ids_batch AS
SELECT coc.categoryoptioncomboid
FROM categoryoptioncombo coc
INNER JOIN temp_uids_batch t ON t.uid = coc.uid
WHERE NOT EXISTS (
    SELECT 1 FROM datavalue dv 
    WHERE dv.categoryoptioncomboid = coc.categoryoptioncomboid
  )
  AND NOT EXISTS (
    SELECT 1 FROM datavalue dv 
    WHERE dv.attributeoptioncomboid = coc.categoryoptioncomboid
  )
  AND NOT EXISTS (
    SELECT 1 FROM datavalueaudit dva 
    WHERE dva.categoryoptioncomboid = coc.categoryoptioncomboid
  )
  AND NOT EXISTS (
    SELECT 1 FROM datavalueaudit dva 
    WHERE dva.attributeoptioncomboid = coc.categoryoptioncomboid
  )
  AND NOT EXISTS (
    SELECT 1 FROM dataelementoperand deo 
    WHERE deo.categoryoptioncomboid = coc.categoryoptioncomboid
  )
  AND NOT EXISTS (
    SELECT 1 FROM completedatasetregistration csdr 
    WHERE csdr.attributeoptioncomboid = coc.categoryoptioncomboid
  )
  AND NOT EXISTS (
    SELECT 1 FROM datadimensionitem ddi 
    WHERE ddi.dataelementoperand_categoryoptioncomboid = coc.categoryoptioncomboid
  );    


DELETE FROM categoryoptioncombos_categoryoptions 
WHERE categoryoptioncomboid IN (SELECT categoryoptioncomboid FROM temp_ids_batch);

DELETE FROM categorycombos_optioncombos 
WHERE categoryoptioncomboid IN (SELECT categoryoptioncomboid FROM temp_ids_batch);

DELETE FROM categoryoptioncombo 
WHERE categoryoptioncomboid IN (SELECT categoryoptioncomboid FROM temp_ids_batch);

DROP TABLE temp_uids_batch;
DROP TABLE temp_ids_batch;

`;
        });

        return `BEGIN;${batchStatements.join("\n")}COMMIT;`.trim();
    }

    private writeToDisk(sqlScript: string): void {
        const fileName = `${this.pathToFile}.sql`;
        writeFileSync(fileName, sqlScript);
        logger.info(`SQL generated: ${fileName}`);
        logger.info(`You can execute the sql with d2-docker: d2-docker run-sql ${fileName}`);
    }
}
