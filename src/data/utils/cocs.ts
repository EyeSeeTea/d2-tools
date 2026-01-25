import _ from "lodash";
import { D2CategoryCombo } from "data/CategoryOptionCombosD2Repository";
import { getId, Id, Ref } from "domain/entities/Base";
import logger from "utils/log";

export function mapCategoryOptionIdToCategoryIndex(categoryCombo: D2CategoryCombo): Record<Id, number> {
    return _(categoryCombo.categories)
        .flatMap((category, categoryIndex) => {
            return category.categoryOptions.map(categoryOption => {
                return [categoryOption.id, categoryIndex] as [Id, number];
            });
        })
        .fromPairs()
        .value();
}

export function fixCategoryOptionOrder<T extends { id: Id; categoryOptions: Ref[] }>(
    coc: T,
    indexesByCategoryOptionId: Record<string, number>
) {
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
}
