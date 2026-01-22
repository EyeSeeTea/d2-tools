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
        missingCategoryOptionCombos: NamedRef[];
    } {
        const allOptions = categoryCombo.categories.map(cat => cat.categoryOptions);

        const combinations = this.cartesianProduct(allOptions);

        const existingCategoryOptionCombosByKey = new Map<
            string,
            CategoryCombo["categoryOptionCombos"][number]
        >(
            categoryCombo.categoryOptionCombos.map(categoryOptionCombo => [
                this.getCategoryOptionComboKey(categoryOptionCombo.categoryOptions),
                categoryOptionCombo,
            ])
        );

        const categoryOptionCombos = combinations.map((combination): NamedRef => {
            const combinationName = combination.map(opt => opt.name).join(", ");
            const combinationKey = this.getCategoryOptionComboKey(combination);
            const existingCategoryOptionCombo = existingCategoryOptionCombosByKey.get(combinationKey);
            if (existingCategoryOptionCombo) {
                return { id: existingCategoryOptionCombo.id, name: existingCategoryOptionCombo.name };
            }

            return { id: getUid(combinationName, ""), name: combinationName };
        });

        const regeneratedCategoryOptionComboKeys = new Set(
            combinations.map(combination => this.getCategoryOptionComboKey(combination))
        );
        const missingCategoryOptionCombos = categoryCombo.categoryOptionCombos.filter(
            categoryOptionCombo =>
                !regeneratedCategoryOptionComboKeys.has(
                    this.getCategoryOptionComboKey(categoryOptionCombo.categoryOptions)
                )
        );

        logger.debug(
            `Regenerated ${categoryOptionCombos.length} combinations for categoryCombo ${categoryCombo.name} (${categoryCombo.id})`
        );
        logger.debug(
            `Found ${missingCategoryOptionCombos.length} missing combinations for categoryCombo ${categoryCombo.name} (${categoryCombo.id})`
        );

        return { categoryCombo, categoryOptionCombos, missingCategoryOptionCombos };
    }

    private cartesianProduct<T>(arrays: T[][]): T[][] {
        if (arrays.length === 0) return [[]];

        return arrays.reduce<T[][]>(
            (accumulator, currentArray) =>
                accumulator.flatMap(combination => currentArray.map(item => [...combination, item])),
            [[]]
        );
    }

    private getCategoryOptionComboKey(categoryOptions: NamedRef[]): string {
        return categoryOptions.map(categoryOption => categoryOption.id).join("|");
    }
}

type UseCaseResult = {
    result: Array<{
        categoryCombo: CategoryCombo;
        categoryOptionCombos: NamedRef[];
        missingCategoryOptionCombos: NamedRef[];
    }>;
};
