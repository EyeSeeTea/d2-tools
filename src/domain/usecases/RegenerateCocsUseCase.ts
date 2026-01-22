import logger from "utils/log";
import { getUid } from "data/dhis2";
import { NamedRef } from "domain/entities/Base";
import { CategoryCombo } from "domain/entities/CategoryCombo";
import { CategoryComboRepository } from "domain/repositories/CategoryComboRepository";

export class RegenerateCocsUseCase {
    constructor(private options: { categoryComboRepository: CategoryComboRepository }) {}

    async execute(): Promise<UseCaseResult> {
        const categoryCombos = await this.getCategoryCombos();

        const categoryComboWithGeneratedCocs = categoryCombos.map(categoryCombo =>
            this.generateCombinationsFromCategoryCombo(categoryCombo)
        );

        return { result: categoryComboWithGeneratedCocs };
    }

    private async getCategoryCombos(): Promise<CategoryCombo[]> {
        logger.info("Fetching categoryOptionCombos...");
        const categoryCombos = await this.options.categoryComboRepository.getAll();
        logger.info(`${categoryCombos.length} categoryOptionCombos found.`);
        return categoryCombos;
    }

    private generateCombinationsFromCategoryCombo(categoryCombo: CategoryCombo): {
        categoryCombo: CategoryCombo;
        categoryOptionCombos: NamedRef[];
    } {
        const allOptions = categoryCombo.categories.map(cat => cat.options);

        const combinations = this.cartesianProduct(allOptions);

        const categoryOptionCombos = combinations.map((combination): NamedRef => {
            const combinationName = combination.map(opt => opt.name).join(", ");
            return { id: getUid(combinationName, ""), name: combinationName };
        });

        logger.debug(
            `Regenerated ${categoryOptionCombos.length} combinations for categoryCombo ${categoryCombo.name} (${categoryCombo.id})`
        );

        return { categoryCombo, categoryOptionCombos };
    }

    private cartesianProduct<T>(arrays: T[][]): T[][] {
        if (arrays.length === 0) return [[]];

        return arrays.reduce<T[][]>(
            (accumulator, currentArray) =>
                accumulator.flatMap(combination => currentArray.map(item => [...combination, item])),
            [[]]
        );
    }
}

type UseCaseResult = {
    result: Array<{ categoryCombo: CategoryCombo; categoryOptionCombos: NamedRef[] }>;
};
