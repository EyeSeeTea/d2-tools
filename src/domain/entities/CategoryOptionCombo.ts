import { Id } from "./Base";
import { Translation } from "./Translation";

export type CategoryOptionCombo = {
    id: Id;
    name: string;
    translations: Translation<"NAME">[];
    categoryOptions: CocOption[];
};

export type CocOption = {
    id: Id;
    name: string;
    translations: Translation<"NAME">[];
};
