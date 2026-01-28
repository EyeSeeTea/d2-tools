import { command, flag } from "cmd-ts";
import { RegeneratedCocD2Repository } from "data/RegeneratedCocD2Repository";
import { CategoryComboD2Repository } from "data/CategoryComboD2Repository";
import { RegenerateCocsUseCase, RegenerateCocsUseCaseResult } from "domain/usecases/RegenerateCocsUseCase";
import { writeFileSync } from "fs";
import { getApiUrlOptions, getD2ApiFromArgs } from "scripts/common";
import logger from "utils/log";
import { getCurrentTime } from "utils/date";

export const regenerateCocsCmd = command({
    name: "regenerate",
    description: "Regenerate categoryOptionCombos for categoryCombos",
    args: {
        ...getApiUrlOptions(),
        persist: flag({
            long: "persist",
            description: "persist the change to DHIS (default: false)",
        }),
        deleteCocs: flag({
            long: "delete-cocs",
            description: "delete obsolete categoryOptionCombos (default: false)",
        }),
        generateSqlDeleteScript: flag({
            long: "generate-sql-delete-script",
            description: "generate a SQL script to delete obsolete categoryOptionCombos (default: false)",
        }),
    },
    handler: async args => {
        const api = getD2ApiFromArgs(args);
        const categoryComboRepository = new CategoryComboD2Repository(api);
        const regeneratedCocRepository = new RegeneratedCocD2Repository(api);
        const useCase = new RegenerateCocsUseCase({ categoryComboRepository, regeneratedCocRepository });

        try {
            const response = await useCase.execute({ persist: args.persist, deleteCocs: args.deleteCocs });
            generateJsonReport(response.categoryCombos);
            if (args.generateSqlDeleteScript) {
                generateSqlDeleteScript(response.categoryCombos);
            }
        } catch (error) {
            logger.error(`Error regenerating categoryOptionCombos: ${JSON.stringify(error, null, 2)}`);
            process.exit(1);
        }
    },
});

function generateJsonReport(categoryCombos: RegenerateCocsUseCaseResult["categoryCombos"]): void {
    const currentTime = getCurrentTime();
    const fileName = `regenerated-category-option-combos-${currentTime}.json`;

    const jsonReport = categoryCombos.map(catCombo => ({
        id: catCombo.categoryCombo.id,
        name: catCombo.categoryCombo.name,
        totalCocsGenerated: catCombo.allCategoryOptionCombos.length,
        totalCocsSaved: catCombo.categoryOptionCombos.length,
        totalCocsToDelete: catCombo.cocsToDelete.length,
        cocsToDelete: catCombo.cocsToDelete.map(coc => ({ id: coc.id, name: coc.name })),
    }));

    writeFileSync(fileName, JSON.stringify(jsonReport, null, 2));
    logger.info(`Report generated: ${fileName}`);
}

const createDeleteUnusedCategoryOptionCombosSQL = (
    uids: ReadonlyArray<string>,
    batchSize: number = 500
): string => {
    const batches = Array.from({ length: Math.ceil(uids.length / batchSize) }, (_, i) =>
        uids.slice(i * batchSize, (i + 1) * batchSize)
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
};

function generateSqlDeleteScript(categoryCombos: RegenerateCocsUseCaseResult["categoryCombos"]): void {
    const allIds = categoryCombos.flatMap(catCombo => catCombo.cocsToDelete.map(coc => coc.id));
    const sqlScript = createDeleteUnusedCategoryOptionCombosSQL(allIds);

    const currentTime = getCurrentTime();
    const fileName = `delete-category-option-combos-${currentTime}.sql`;
    writeFileSync(fileName, sqlScript);
    logger.info(`SQL generated: ${fileName}`);
    logger.info(`You can execute the sql with d2-docker: d2-docker run-sql ${fileName}`);
}
