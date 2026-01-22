import _ from "lodash";
import { CategoryCombo } from "domain/entities/CategoryCombo";
import { D2Api, Id } from "../../types/d2-api";
import { CategoryComboRepository } from "./CategoryComboRepository";
import logger from "utils/log";

export class CategoryComboD2Repository implements CategoryComboRepository {
    constructor(private api: D2Api) {}

    async getAll(): Promise<CategoryCombo[]> {
        return this.getAllByPages({ page: 1, pageSize: 100, categoryCombos: [] });
    }

    async getAllByPages(options: {
        page: number;
        pageSize: number;
        categoryCombos: CategoryCombo[];
    }): Promise<CategoryCombo[]> {
        const { page, pageSize, categoryCombos } = options;

        const response = await this.getCategoryCombos({ page, pageSize });
        const newRecords = [...categoryCombos, ...response.objects];
        const pager = response.pager;
        if (pager.page >= pager.pageCount) {
            return newRecords;
        } else {
            return this.getAllByPages({ page: page + 1, pageSize, categoryCombos: newRecords });
        }
    }

    private async getCategoryCombos(options: { page: number; pageSize: number }) {
        const response = await this.api.models.categoryCombos
            .get({
                fields: {
                    id: true,
                    name: true,
                    categories: { id: true, categoryOptions: { id: true, name: true } },
                    categoryOptionCombos: { id: true, name: true, categoryOptions: { id: true, name: true } },
                },
                page: options.page,
                pageSize: options.pageSize,
            })
            .getData();

        const categoryCombos = _(response.objects)
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
                    categoryOptionCombos: this.reorderCategoryOptionCombos(catComboData),
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

        return { objects: categoryCombos, pager: response.pager };
    }

    private reorderCategoryOptionCombos(catComboData: {
        id: Id;
        categories: Array<{ id: Id; categoryOptions: Array<{ id: Id; name: string }> }>;
        categoryOptionCombos: Array<{
            id: Id;
            name: string;
            categoryOptions: Array<{ id: Id; name: string }>;
        }>;
    }) {
        const optionOrderById = new Map<Id, number>();
        let index = 0;

        catComboData.categories.forEach(category => {
            category.categoryOptions.forEach(categoryOption => {
                optionOrderById.set(categoryOption.id, index);
                index += 1;
            });
        });

        return catComboData.categoryOptionCombos.map(categoryOptionCombo => {
            const missingOptions = categoryOptionCombo.categoryOptions.filter(
                categoryOption => !optionOrderById.has(categoryOption.id)
            );

            if (!_.isEmpty(missingOptions)) {
                const missingIds = missingOptions.map(categoryOption => categoryOption.id).join(", ");
                logger.debug(
                    `[categoryCombo.id="${catComboData.id}"][coc.id="${categoryOptionCombo.id}"] Category options not found in categoryCombo: ${missingIds}`
                );
                return { ...categoryOptionCombo, categoryOptions: [] };
            }

            const sortedOptions = [...categoryOptionCombo.categoryOptions].sort((left, right) => {
                return (optionOrderById.get(left.id) ?? 0) - (optionOrderById.get(right.id) ?? 0);
            });

            return { ...categoryOptionCombo, categoryOptions: sortedOptions };
        });
    }
}
