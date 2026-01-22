import { CategoryCombo } from "domain/entities/CategoryCombo";

export interface CategoryComboRepository {
    getAll(): Promise<CategoryCombo[]>;
}
