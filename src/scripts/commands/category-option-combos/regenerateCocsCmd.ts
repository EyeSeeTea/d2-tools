import { command, flag } from "cmd-ts";
import { RegeneratedCocD2Repository } from "data/RegeneratedCocD2Repository";
import { CategoryComboD2Repository } from "domain/repositories/CategoryComboD2Repository";
import { RegenerateCocsUseCase, RegenerateCocsUseCaseResult } from "domain/usecases/RegenerateCocsUseCase";
import { writeFileSync } from "fs";
import { getApiUrlOptions, getD2ApiFromArgs } from "scripts/common";
import logger from "utils/log";

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
            long: "deleteCocs",
            description: "delete obsolete categoryOptionCombos (default: false)",
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
        } catch (error) {
            logger.error(`Error regenerating categoryOptionCombos: ${JSON.stringify(error, null, 2)}`);
            process.exit(1);
        }
    },
});

function generateJsonReport(categoryCombos: RegenerateCocsUseCaseResult["categoryCombos"]): void {
    const currentTime = new Date().toISOString().replace(/[:.]/g, "-");
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
