import { Id, NamedRef } from "domain/entities/Base";
import { CategoryOptionCombo } from "domain/entities/CategoryOptionCombo";

export interface CategoryOptionCombosRepository {
    get(options: CategoryOptionCombosRepositoryGetOptions): Promise<CategoryOptionCombo[]>;
    save(cocs: CategoryOptionCombo[]): Promise<void>;
    getCOCombosNames(ids: Id[]): Promise<NamedRef[]>;
}

export type CategoryOptionCombosRepositoryGetOptions = {
    pagination: { page: number; pageSize: number };
    categoryComboIds?: Id[];
};
