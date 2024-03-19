import { Path } from "./Base";
import { CategoryOption } from "./CategoryOption";
import { RegularExpresionValue } from "./CategoryOptionSettings";

export type CategoryOptionSpreadsheet = {
    categoryOptions: CategoryOptionReport[];
    reportPath: Path;
};

export type CategoryOptionReport = {
    filter: RegularExpresionValue;
    missingGroups: string;
    categoryOptions: CategoryOption[];
};
