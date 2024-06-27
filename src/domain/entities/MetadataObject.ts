import { Maybe } from "utils/ts-utils";
import { Id } from "./Base";
import { Translation } from "./Translation";

export type MetadataModel = string; // Ex: "dataElements".

export interface MetadataObject {
    model: MetadataModel;
    id: Id;
    name: string;
    code: Maybe<string>;
}

export interface MetadataObjectWithTranslations extends MetadataObject {
    translations: Translation[];
}
