import { Async } from "domain/entities/Async";
import { CategoryOption } from "domain/entities/CategoryOption";
import { Stats } from "domain/entities/Stats";

export interface CategoryOptionRepository {
    getAll(params: CategoryOptionParams): Async<CategoryOption[]>;
    saveAll(sharing: CategoryOption[]): Async<Stats>;
}

export type CategoryOptionParams = {
    page: number;
};
