import _ from "lodash";
import { D2Api, Id } from "types/d2-api";
import { NamedRef } from "domain/entities/Base";
import { CategoryOptionCombosRepository } from "domain/repositories/CategoryOptionCombosRepository";

export class CategoryOptionCombosD2Repository implements CategoryOptionCombosRepository {
    constructor(private api: D2Api) {}

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
