import _ from "lodash";
import { CategoryCombo } from "domain/entities/CategoryCombo";
import { D2Api, Id } from "../../types/d2-api";
import { CategoryComboRepository } from "./CategoryComboRepository";
import { fixCategoryOptionOrder, mapCategoryOptionIdToCategoryIndex } from "data/utils/cocs";

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

    private reorderCategoryOptionCombos(catComboData: D2ApiCategoryCombo) {
        return catComboData.categoryOptionCombos.map(categoryOptionCombo => {
            const indexesByCategoryOptionId = mapCategoryOptionIdToCategoryIndex(catComboData);
            return fixCategoryOptionOrder(categoryOptionCombo, indexesByCategoryOptionId);
        });
    }
}

type D2ApiCategoryCombo = {
    id: Id;
    categories: Array<{ id: Id; categoryOptions: Array<{ id: Id; name: string }> }>;
    categoryOptionCombos: Array<{
        id: Id;
        name: string;
        categoryOptions: Array<{ id: Id; name: string }>;
    }>;
};
