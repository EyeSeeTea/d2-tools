import { Id } from "./Base";
import { Translation } from "./Translation";

export interface DataElement {
    id: Id;
    name: string;
    formName: string;
    translations: Translation[];
}
