import { Id } from "./Base";
import { Translation } from "./Translation";

export interface MetadataObject {
    model: string; // singular. Ex: dataElement, dataSet.
    id: Id;
    name: string;
    code: string;
    translations: Translation[];
}
