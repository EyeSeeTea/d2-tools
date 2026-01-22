import { Id, NamedRef } from "./Base";
import { Either } from "./generic/Either";
import { Struct } from "./generic/Struct";
import { ValidationError } from "./generic/ValidationError";

export type CategoryComboAttrs = {
    id: Id;
    name: string;
    categories: Array<{ id: Id; categoryOptions: NamedRef[] }>;
    categoryOptionCombos: Array<{ id: Id; name: string; categoryOptions: NamedRef[] }>;
};

export type CategoryOption = {
    id: Id;
    name: string;
};

export class CategoryCombo extends Struct<CategoryComboAttrs>() {
    static build(data: CategoryComboAttrs): Either<ValidationError<CategoryCombo>[], CategoryCombo> {
        const validationErrors = this.validate(data);
        if (validationErrors.length > 0) return Either.error(validationErrors);

        return Either.success(this.create(data));
    }

    private static validate(data: CategoryComboAttrs): ValidationError<CategoryCombo>[] {
        const idErrors: ValidationError<CategoryCombo>[] = data.id
            ? []
            : [{ property: "id", errors: [{ code: "required" }] }];

        const nameErrors: ValidationError<CategoryCombo>[] = data.name
            ? []
            : [{ property: "name", errors: [{ code: "required" }] }];

        const categories: ValidationError<CategoryCombo>[] = data.categories.length
            ? []
            : [{ property: "categories", errors: [{ code: "required" }] }];

        const options: ValidationError<CategoryCombo>[] = data.categories.flatMap(category =>
            category.categoryOptions.length
                ? []
                : [{ property: "categories", errors: [{ code: "empty_options" }] }]
        );

        return [...idErrors, ...nameErrors, ...categories, ...options];
    }
}
