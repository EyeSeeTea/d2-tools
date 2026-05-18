import _ from "lodash";
import { CategoryCombo } from "domain/entities/CategoryCombo";
import { D2Api, Id, MetadataPick } from "../types/d2-api";
import { CategoryComboRepository } from "../domain/repositories/CategoryComboRepository";
import logger from "utils/log";
import { promiseMap } from "./dhis2-utils";

export class CategoryComboD2Repository implements CategoryComboRepository {
    constructor(private api: D2Api) {}

    async getAll(): Promise<CategoryCombo[]> {
        return this.getAllByPages({ page: 1, pageSize: 100, categoryCombos: [] });
    }

    async getByIds(ids: Id[]): Promise<CategoryCombo[]> {
        const allCombos = await promiseMap(_.chunk(ids, 100), async catComboIds => {
            const response = await this.api.models.categoryCombos
                .get({ fields: fields, paging: false, filter: { id: { in: catComboIds } } })
                .getData();

            return this.buildCategoryCombo(response.objects);
        });

        return allCombos.flat();
    }

    private async getAllByPages(options: {
        page: number;
        pageSize: number;
        categoryCombos: CategoryCombo[];
        ids?: Id[];
    }): Promise<CategoryCombo[]> {
        const { page, pageSize, categoryCombos, ids } = options;

        const response = await this.getCategoryCombos({ page, pageSize, ids });
        const newRecords = [...categoryCombos, ...response.objects];
        const pager = response.pager;
        if (pager.page >= pager.pageCount) {
            return newRecords;
        } else {
            return this.getAllByPages({ page: page + 1, pageSize, categoryCombos: newRecords, ids });
        }
    }

    private async getCategoryCombos(options: { page: number; pageSize: number; ids?: Id[] }) {
        const response = await this.api.models.categoryCombos
            .get({ fields: fields, page: options.page, pageSize: options.pageSize })
            .getData();

        const categoryCombos = this.buildCategoryCombo(response.objects);

        return { objects: categoryCombos, pager: response.pager };
    }

    private buildCategoryCombo(catComboData: CategoryComboFields[]): CategoryCombo[] {
        return _(catComboData)
            .map(catComboData => {
                const categoryCombo = CategoryCombo.build({
                    id: catComboData.id,
                    name: catComboData.name,
                    categories: catComboData.categories.map(catData => ({
                        id: catData.id,
                        categoryOptions: catData.categoryOptions.map(optData => ({
                            id: optData.id,
                            name: optData.name,
                        })),
                    })),
                    categoryOptionCombos: reorderCocsByOptionIndex(catComboData),
                });

                if (categoryCombo.isError()) {
                    console.warn(
                        `Invalid CategoryCombo name=${catComboData.name} id=${catComboData.id}:`,
                        categoryCombo.value.error
                            .map(e => `${e.property}: ${e.errors.map(err => err.code).join(", ")}`)
                            .join("; ")
                    );
                }

                return categoryCombo.value.data;
            })
            .compact()
            .value();
    }
}

export type D2ApiCategoryCombo = {
    id: Id;
    categories: Array<{ id: Id; categoryOptions: Array<{ id: Id; name: string }> }>;
    categoryOptionCombos: Array<{
        id: Id;
        name: string;
        categoryOptions: Array<{ id: Id; name: string }>;
    }>;
};

export function reorderCocsByOptionIndex(catComboData: D2ApiCategoryCombo) {
    const categoryIndexesByOptionId = _(catComboData.categories)
        .flatMap((category, categoryIndex) =>
            category.categoryOptions.map(categoryOption => [categoryOption.id, categoryIndex] as const)
        )
        .groupBy(([categoryOptionId]) => categoryOptionId)
        .mapValues(entries => entries.map(([_, categoryIndex]) => categoryIndex).sort((a, b) => a - b))
        .value();

    return catComboData.categoryOptionCombos.map(categoryOptionCombo => {
        const hasUnknownCategoryOption = categoryOptionCombo.categoryOptions.some(
            categoryOption => !categoryIndexesByOptionId[categoryOption.id]
        );

        if (hasUnknownCategoryOption) {
            logger.debug("Return an empty array as categoryOptions to avoid unsafely relying on its order.");
            return { ...categoryOptionCombo, categoryOptions: [] };
        }

        const assignmentCountByOptionId = new Map<Id, number>();

        const categoryIndexByCocOptionPosition = categoryOptionCombo.categoryOptions.map(categoryOption => {
            const categoryIndexes = categoryIndexesByOptionId[categoryOption.id] ?? [];
            const alreadyAssignedCount = assignmentCountByOptionId.get(categoryOption.id) ?? 0;
            assignmentCountByOptionId.set(categoryOption.id, alreadyAssignedCount + 1);

            if (categoryIndexes.length === 0) return Number.MAX_SAFE_INTEGER;

            return categoryIndexes[Math.min(alreadyAssignedCount, categoryIndexes.length - 1)];
        });

        return {
            ...categoryOptionCombo,
            categoryOptions: _(categoryOptionCombo.categoryOptions)
                .map((categoryOption, inputPosition) => ({
                    categoryOption,
                    categoryIndex: categoryIndexByCocOptionPosition[inputPosition],
                    inputPosition,
                }))
                .sortBy([item => item.categoryIndex, item => item.inputPosition])
                .map(item => item.categoryOption)
                .value(),
        };
    });
}

const fields = {
    id: true,
    name: true,
    categories: { id: true, categoryOptions: { id: true, name: true } },
    categoryOptionCombos: { id: true, name: true, categoryOptions: { id: true, name: true } },
} as const;

type CategoryComboFields = MetadataPick<{
    categoryCombos: { fields: typeof fields };
}>["categoryCombos"][number];
