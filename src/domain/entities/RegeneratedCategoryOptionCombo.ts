import { Struct } from "./generic/Struct";

type RegeneratedCategoryOptionComboAttrs = {
    id: string;
    name: string;
};

export class RegeneratedCategoryOptionCombo extends Struct<RegeneratedCategoryOptionComboAttrs>() {
    static build(data: RegeneratedCategoryOptionComboAttrs): RegeneratedCategoryOptionCombo {
        return this.create(data);
    }
}
