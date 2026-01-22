import { command } from "cmd-ts";
import { CategoryComboD2Repository } from "domain/repositories/CategoryComboD2Repository";
import { RegenerateCocsUseCase } from "domain/usecases/RegenerateCocsUseCase";
import { writeFileSync } from "fs";
import { getApiUrlOptions, getD2ApiFromArgs } from "scripts/common";

export const regenerateCocsCmd = command({
    name: "regenerate",
    description: "Regenerate categoryOptionCombos for Category Combos",
    args: {
        ...getApiUrlOptions(),
    },
    handler: async args => {
        const api = getD2ApiFromArgs(args);
        const categoryComboRepository = new CategoryComboD2Repository(api);
        const useCase = new RegenerateCocsUseCase({ categoryComboRepository });

        try {
            const result = await useCase.execute();
            const fileName = "regenerated-category-option-combos.json";
            writeFileSync(fileName, JSON.stringify(result, null, 2));
            console.log(`Regenerated categoryOptionCombos saved to ${fileName}`);
        } catch (error) {
            console.error("Error regenerating categoryOptionCombos:", error);
            process.exit(1);
        }
    },
});
