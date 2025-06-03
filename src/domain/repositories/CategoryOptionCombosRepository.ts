import { Id, NamedRef } from "domain/entities/Base";
import { CategoryOptionCombo } from "domain/entities/CategoryOptionCombo";
import { Paginated } from "domain/entities/Pagination";

export interface CategoryOptionCombosRepository {
    get(options: CategoryOptionCombosRepositoryGetOptions): Promise<Paginated<CategoryOptionCombo>>;
    save(cocs: CategoryOptionCombo[]): Promise<void>;
    getCOCombosNames(ids: Id[]): Promise<NamedRef[]>;
}

export type CategoryOptionCombosRepositoryGetOptions = {
    pagination: { page: number; pageSize: number };
    categoryComboIds?: Id[];
};

export type CategoryOptionCombosRepositoryGetResponse = {
    pagination: Paginated<CategoryOptionCombo>;
    categoryComboIds?: Id[];
};
