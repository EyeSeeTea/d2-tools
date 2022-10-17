//
import log from "loglevel";
import { errorCreator } from "capture-core-utils";
import { Category } from "../../../../metaData";

export class CategoryFactory {
    constructor(cachedCategories) {
        this.cachedCategories = cachedCategories;
    }

    build(cachedProgramCategory) {
        return new Category(category => {
            const id = cachedProgramCategory.id;
            category.id = id;
            const cachedCategory = this.cachedCategories[id];
            if (!cachedCategory) {
                log.error(errorCreator("Could not retrieve cachedCategory")({ id }));
            } else {
                category.name = cachedCategory.displayName;
            }
        });
    }
}
