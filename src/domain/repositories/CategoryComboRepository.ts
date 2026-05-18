import { Id } from "domain/entities/Base";
import { CategoryCombo } from "domain/entities/CategoryCombo";

export interface CategoryComboRepository {
    getAll(): Promise<CategoryCombo[]>;
    getByIds(ids: Id[]): Promise<CategoryCombo[]>;
}
