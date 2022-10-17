import { Maybe } from "utils/ts-utils";
import { NamedRef } from "./Base";
import { DataValue } from "./DataValue";

export interface DanglingDataValue {
    dataValue: DataValue;
    dataSet: Maybe<NamedRef>;
    errors: string[];
}
