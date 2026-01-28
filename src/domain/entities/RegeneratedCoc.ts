import { Id, Ref } from "./Base";
import { Struct } from "./generic/Struct";

type RegeneratedCocAttrs = {
    id: Id;
    name: string;
    categoryCombo: { id: Id };
    categoryOptions: Ref[];
};

export class RegeneratedCoc extends Struct<RegeneratedCocAttrs>() {}
