import _ from "lodash";
import logger from "utils/log";
import { getUid } from "data/dhis2";
import { NamedRef } from "domain/entities/Base";
import { CategoryCombo } from "domain/entities/CategoryCombo";
import { CategoryComboRepository } from "domain/repositories/CategoryComboRepository";
import { RegeneratedCoc } from "domain/entities/RegeneratedCoc";
import { RegeneratedCocRepository } from "domain/repositories/RegeneratedCocRepository";
import { Stats } from "domain/entities/Stats";
import { CategoryOptionComboDeleteExporter } from "domain/repositories/CategoryOptionComboDeleteExporter";
import { Maybe } from "utils/ts-utils";

export class RegenerateCocsUseCase {
    constructor(
        private options: {
            categoryComboRepository: CategoryComboRepository;
            regeneratedCocRepository: RegeneratedCocRepository;
            cocDeleteExporter: CategoryOptionComboDeleteExporter;
        }
    ) {}

    async execute(options: UseCaseArgs): Promise<RegenerateCocsUseCaseResult> {
        const categoryCombos = await this.getCategoryCombos();
        const categoryComboWithGeneratedCocs = categoryCombos.map(categoryCombo =>
            this.generateCombinationsFromCategoryCombo(categoryCombo)
        );

        await this.saveCocs(categoryComboWithGeneratedCocs, options);

        if (options.deleteCocs) {
            await this.deleteCocs(categoryComboWithGeneratedCocs);
        }

        return {
            categoryCombos: categoryComboWithGeneratedCocs,
            sqlDeleteScript: this.buildSqlDeleteScript(options, categoryComboWithGeneratedCocs),
        };
    }

    private buildSqlDeleteScript(
        options: UseCaseArgs,
        categoryComboWithGeneratedCocs: RegenerateCocsUseCaseResult["categoryCombos"]
    ): Maybe<string> {
        const { generateSqlDeleteScript } = options;
        if (!generateSqlDeleteScript) return undefined;

        const cocIdsToDelete = categoryComboWithGeneratedCocs.flatMap(item =>
            item.cocsToDelete.map(coc => coc.id)
        );
        return this.options.cocDeleteExporter.exportDeleteScript(cocIdsToDelete);
    }

    private async saveCocs(
        categoryComboWithGeneratedCocs: RegenerateCocsUseCaseResult["categoryCombos"],
        options: UseCaseArgs
    ): Promise<Stats> {
        const cocsToCreate = _(categoryComboWithGeneratedCocs)
            .flatMap(item => item.categoryOptionCombos)
            .uniqBy(coc => coc.id)
            .value();
        logger.info(`Saving ${cocsToCreate.length} categoryOptionCombos...`);
        const saveStats = await this.options.regeneratedCocRepository.save(cocsToCreate, {
            persist: options.persist,
            persistInDisk: true,
        });
        logger.info(`Finished: ${JSON.stringify(saveStats, null, 2)}`);
        return saveStats;
    }

    private async deleteCocs(
        categoryComboWithGeneratedCocs: RegenerateCocsUseCaseResult["categoryCombos"]
    ): Promise<Stats> {
        const cocIdsToDelete = categoryComboWithGeneratedCocs.flatMap(item =>
            item.cocsToDelete.map(coc => coc.id)
        );
        logger.info(`Deleting ${cocIdsToDelete.length} categoryOptionCombos...`);
        const deleteStats = await this.options.regeneratedCocRepository.deleteByIds(cocIdsToDelete, {
            persist: true,
        });
        logger.info(`Finished: ${JSON.stringify(deleteStats, null, 2)}`);
        return deleteStats;
    }

    private async getCategoryCombos(): Promise<CategoryCombo[]> {
        logger.info("Fetching categoryOptionCombos...");
        const categoryCombos = await this.options.categoryComboRepository.getAll();
        logger.info(`${categoryCombos.length} categoryOptionCombos found.`);
        return categoryCombos;
    }

    private generateCombinationsFromCategoryCombo(categoryCombo: CategoryCombo): {
        categoryCombo: CategoryCombo;
        categoryOptionCombos: RegeneratedCoc[];
        allCategoryOptionCombos: RegeneratedCoc[];
        cocsToDelete: RegeneratedCoc[];
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

        const categoryOptionCombos = combinations.map(
            (combination): { regeneratedCoc: RegeneratedCoc; toBeSaved: boolean } => {
                const combinationName = combination.map(opt => opt.name).join(", ");
                const combinationKey = this.getCategoryOptionComboKey(combination);
                const categoryOptionComboId = getUid(combinationKey, categoryCombo.id);

                const existingCategoryOptionCombo = existingCategoryOptionCombosByKey.get(combinationKey);

                if (existingCategoryOptionCombo) {
                    const regeneratedCoc = RegeneratedCoc.create({
                        id: existingCategoryOptionCombo.id,
                        name: combinationName,
                        categoryCombo: { id: categoryCombo.id },
                        categoryOptions: combination,
                    });

                    return {
                        regeneratedCoc,
                        toBeSaved: existingCategoryOptionCombo.name !== combinationName,
                    };
                }

                return {
                    regeneratedCoc: RegeneratedCoc.create({
                        id: categoryOptionComboId,
                        name: combinationName,
                        categoryCombo: { id: categoryCombo.id },
                        categoryOptions: combination,
                    }),
                    toBeSaved: true,
                };
            }
        );

        const regeneratedCategoryOptionComboKeys = new Set(
            combinations.map(combination => this.getCategoryOptionComboKey(combination))
        );

        const cocsToDelete = categoryCombo.categoryOptionCombos.filter(
            categoryOptionCombo =>
                !regeneratedCategoryOptionComboKeys.has(
                    this.getCategoryOptionComboKey(categoryOptionCombo.categoryOptions)
                )
        );

        logger.debug(
            `Regenerated ${categoryOptionCombos.length} combinations for categoryCombo ${categoryCombo.name} (${categoryCombo.id})`
        );

        logger.debug(
            `Found ${cocsToDelete.length} combinations to delete for categoryCombo ${categoryCombo.name} (${categoryCombo.id})`
        );

        const cocsToSave = categoryOptionCombos.filter(coc => coc.toBeSaved).map(coc => coc.regeneratedCoc);

        return {
            categoryCombo,
            categoryOptionCombos: cocsToSave,
            allCategoryOptionCombos: categoryOptionCombos.map(coc => coc.regeneratedCoc),
            cocsToDelete: cocsToDelete.map(coc =>
                RegeneratedCoc.create({
                    id: coc.id,
                    name: coc.name,
                    categoryCombo: { id: categoryCombo.id },
                    categoryOptions: coc.categoryOptions,
                })
            ),
        };
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
        return _(categoryOptions)
            .map(categoryOption => categoryOption.id)
            .sort()
            .uniq()
            .join("|");
    }
}

export type RegenerateCocsUseCaseResult = {
    categoryCombos: Array<{
        categoryCombo: CategoryCombo;
        categoryOptionCombos: RegeneratedCoc[];
        allCategoryOptionCombos: RegeneratedCoc[];
        cocsToDelete: RegeneratedCoc[];
    }>;
    sqlDeleteScript: Maybe<string>;
};

type UseCaseArgs = { deleteCocs: boolean; persist: boolean; generateSqlDeleteScript: boolean };
