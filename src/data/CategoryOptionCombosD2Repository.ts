import _ from "lodash";
import { D2Api, Id } from "types/d2-api";
import { NamedRef } from "domain/entities/Base";
import {
    CategoryOptionCombosRepository,
    CategoryOptionCombosRepositoryGetOptions,
} from "domain/repositories/CategoryOptionCombosRepository";
import { CategoryOptionCombo } from "domain/entities/CategoryOptionCombo";
import { runMetadata } from "./dhis2-utils";

export class CategoryOptionCombosD2Repository implements CategoryOptionCombosRepository {
    constructor(private api: D2Api) {}

    async get(options: CategoryOptionCombosRepositoryGetOptions): Promise<CategoryOptionCombo[]> {
        const { categoryComboIds = [] } = options;

        const metadata$ = this.api.models.categoryOptionCombos.get({
            fields: {
                id: true,
                name: true,
                translations: { property: true, locale: true, value: true },
                categoryOptions: {
                    id: true,
                    name: true,
                    translations: { property: true, locale: true, value: true },
                },
            },
            filter: !_.isEmpty(categoryComboIds) ? { "categoryCombo.id": { in: categoryComboIds } } : {},
            pageSize: options.pagination.pageSize,
            page: options.pagination.page,
        });

        const res = await metadata$.getData();
        // Bug: DHIS2 API return data (v40: a single object) for a page over the limit.
        // Workaround: Check if the page in the response is the same as the one requested

        return res.pager.page === options.pagination.page ? res.objects : [];
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
