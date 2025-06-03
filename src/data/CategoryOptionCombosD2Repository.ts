import _ from "lodash";
import { D2Api, Id, MetadataPick } from "types/d2-api";
import { getId, NamedRef } from "domain/entities/Base";
import {
    CategoryOptionCombosRepository,
    CategoryOptionCombosRepositoryGetOptions,
} from "domain/repositories/CategoryOptionCombosRepository";
import { CategoryOptionCombo } from "domain/entities/CategoryOptionCombo";
import { runMetadata } from "./dhis2-utils";
import { Paginated } from "domain/entities/Pagination";
import logger from "utils/log";

export class CategoryOptionCombosD2Repository implements CategoryOptionCombosRepository {
    constructor(private api: D2Api) {}

    async get(options: CategoryOptionCombosRepositoryGetOptions): Promise<Paginated<CategoryOptionCombo>> {
        const { categoryComboIds = [] } = options;

        const metadata$ = this.api.models.categoryOptionCombos.get({
            fields: cocQuery,
            filter: !_.isEmpty(categoryComboIds) ? { "categoryCombo.id": { in: categoryComboIds } } : {},
            pageSize: options.pagination.pageSize,
            page: options.pagination.page,
            order: "id:asc",
        });

        const res = await metadata$.getData();

        return {
            objects: await new D2CocOptionsOrderFixer(this.api).fix(res.objects),
            pager: res.pager,
        };
    }

    async save(categoryOptionCombos: CategoryOptionCombo[]): Promise<void> {
        await runMetadata(
            this.api.metadata.post({
                categoryOptionCombos: categoryOptionCombos,
            })
        );
    }

    async getCOCombosNames(ids: Id[]): Promise<NamedRef[]> {
        const metadata$ = this.api.metadata.get({
            categoryOptionCombos: {
                fields: {
                    id: true,
                    name: true,
                },
                filter: { id: { in: ids } },
            },
        });

        const { categoryOptionCombos } = await metadata$.getData();
        const categoryOptionCombosIds = categoryOptionCombos.map(de => de.id);
        const categoryOptionCombosIdsNotFound = _.difference(ids, categoryOptionCombosIds);

        if (!_.isEmpty(categoryOptionCombosIdsNotFound)) {
            throw new Error(`Data Elements not found: ${categoryOptionCombosIdsNotFound.join(", ")}`);
        } else {
            return categoryOptionCombos;
        }
    }
}

const translationsQuery = {
    property: true,
    locale: true,
    value: true,
};

const cocQuery = {
    id: true,
    name: true,
    translations: translationsQuery,
    categoryCombo: { id: true },
    categoryOptions: {
        id: true,
        name: true,
        translations: translationsQuery,
    },
} as const;

type D2Coc = MetadataPick<{
    categoryOptionCombos: { fields: typeof cocQuery };
}>["categoryOptionCombos"][number];

/*
DHIS2 API returns unordered objects for array categoryOptionCombos.categoryOptions.

This example shows that the order of options is not the same as the order of the COC name:

$ curl -u admin:district 'https://play.im.dhis2.org/dev/api/categoryOptionCombos?filter=categoryCombo.categories:ge:2&pageSize=10&fields=name,categoryOptions[name]' |
    jq -r '.categoryOptionCombos[] | {name, fromOptions: .categoryOptions | map(.name) | join(", ")}'
{"name":"APHIAplus, Improve access to medicines","fromOptions":"Improve access to medicines, APHIAplus"}

As we use this array to translate the COCs, we need them to be in the correct order, that's it,
the one that keeps the order from its categoryCombo (categories->categoryOption)
*/

class D2CocOptionsOrderFixer {
    constructor(private api: D2Api) {}

    async fix(cocs: D2Coc[]): Promise<CategoryOptionCombo[]> {
        const categoryCombosById = await this.getCategoryCombosByIdFromCocs(cocs);

        return cocs.map(coc => {
            const indexesByCategoryOptionId = this.getIndexesMapping(categoryCombosById, coc);

            const categoryOptionsNotFound = _(coc.categoryOptions)
                .filter(categoryOption => indexesByCategoryOptionId[categoryOption.id] === undefined)
                .value();

            if (!_.isEmpty(categoryOptionsNotFound)) {
                // Return an empty array as categoryOptions to avoid unsafely relying on its order.
                const coIds = categoryOptionsNotFound.map(getId).join(", ");
                const msg = `[coc.id="${coc.id}"] Category options no longer in its categoryCombo: ${coIds}`;
                logger.debug(msg);
                return { ...coc, categoryOptions: [] };
            } else {
                const categoryOptionsSorted = _(coc.categoryOptions)
                    .sortBy(categoryOption => indexesByCategoryOptionId[categoryOption.id] || 0)
                    .value();

                return { ...coc, categoryOptions: categoryOptionsSorted };
            }
        });
    }

    private getIndexesMapping(
        categoryCombosById: Record<string, D2CategoryCombo>,
        coc: D2Coc
    ): Record<CategoryOptionId, CategoryIndex> {
        const categoryCombo = categoryCombosById[coc.categoryCombo.id];
        if (!categoryCombo) throw new Error(`Category combo not found: ${coc.categoryCombo.id}`);

        return _(categoryCombo.categories)
            .flatMap((category, categoryIndex) => {
                return category.categoryOptions.map(categoryOption => {
                    return [categoryOption.id, categoryIndex] as [Id, number];
                });
            })
            .fromPairs()
            .value();
    }

    private async getCategoryCombosByIdFromCocs(cocs: D2Coc[]): Promise<Record<Id, D2CategoryCombo>> {
        const categoryComboIds = _(cocs)
            .map(coc => coc.categoryCombo.id)
            .uniq()
            .value();

        const { categoryCombos } = await this.api.metadata
            .get({
                categoryCombos: {
                    fields: {
                        id: true,
                        categories: {
                            categoryOptions: { id: true },
                        },
                    },
                    filter: { id: { in: categoryComboIds } },
                },
            })
            .getData();

        return _.keyBy(categoryCombos, getId);
    }
}

type D2CategoryCombo = {
    id: Id;
    categories: Array<{
        categoryOptions: { id: Id }[];
    }>;
};

type CategoryOptionId = Id;
type CategoryIndex = number;
