import { Maybe } from "utils/ts-utils";
import { Id } from "./Base";
import { Translation } from "./Translation";

export type MetadataModel = string; // In DHIS2 backend, it's plural name. Ex: "dataElements".

export interface MetadataObject {
    model: MetadataModel;
    id: Id;
    name: string;
    code: Maybe<string>;
}

export interface MetadataObjectWithTranslations extends MetadataObject {
    translations: Translation[];
}
