import { command, flag, option, optional } from "cmd-ts";
import { RegeneratedCocD2Repository } from "data/RegeneratedCocD2Repository";
import { CategoryComboD2Repository } from "data/CategoryComboD2Repository";
import { RegenerateCocsUseCase, RegenerateCocsUseCaseResult } from "domain/usecases/RegenerateCocsUseCase";
import { writeFileSync } from "fs";
import { getApiUrlOptions, getD2ApiFromArgs, StringsSeparatedByCommas } from "scripts/common";
import logger from "utils/log";
import { getCurrentTime } from "utils/date";
import { CategoryOptionComboDeleteD2SqlExporter } from "data/CategoryOptionComboDeleteD2SqlExporter";

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
        catCombosIds: option({
            type: optional(StringsSeparatedByCommas),
            long: "cat-combos-ids",
            description:
                "comma-separated list of categoryCombo IDs. If not provided, all categoryCombos will be regenerated.",
        }),
    },
    handler: async args => {
        const currentTime = getCurrentTime();
        const api = getD2ApiFromArgs(args);
        const categoryComboRepository = new CategoryComboD2Repository(api);
        const regeneratedCocRepository = new RegeneratedCocD2Repository(api);

        const cocDeleteExporter = new CategoryOptionComboDeleteD2SqlExporter();

        const useCase = new RegenerateCocsUseCase({
            cocDeleteExporter,
            categoryComboRepository,
            regeneratedCocRepository,
        });

        try {
            const response = await useCase.execute({
                generateSqlDeleteScript: args.generateSqlDeleteScript,
                persist: args.persist,
                deleteCocs: args.deleteCocs,
                catCombosIds: args.catCombosIds,
            });
            generateJsonReport(response.categoryCombos);
            if (response.sqlDeleteScript) {
                writeSqlScriptToDisk(
                    response.sqlDeleteScript,
                    `delete-category-option-combos-${currentTime}.sql`
                );
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

function writeSqlScriptToDisk(sqlScript: string, fileName: string): void {
    writeFileSync(fileName, sqlScript);
    logger.info(`SQL generated: ${fileName}`);
    logger.info(`You can execute the sql with d2-docker: d2-docker run-sql ${fileName}`);
}
