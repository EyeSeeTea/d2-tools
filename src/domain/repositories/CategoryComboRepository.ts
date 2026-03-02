import { Id } from "domain/entities/Base";
import { CategoryCombo } from "domain/entities/CategoryCombo";

export interface CategoryComboRepository {
    getAll(options: { ids?: Id[] }): Promise<CategoryCombo[]>;
}
