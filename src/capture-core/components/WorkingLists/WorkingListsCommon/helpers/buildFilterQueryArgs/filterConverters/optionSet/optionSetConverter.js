//
import { pipe } from "capture-core-utils";
import { convertDataTypeValueToRequest } from "./basicDataTypeConverters";
import {} from "../../../../../../../metaData";

export function convertOptionSet(sourceValue, type) {
    return pipe(
        values => values.map(filterValue => convertDataTypeValueToRequest(filterValue, type)),
        values => values.join(";"),
        valueString => `in:${valueString}`
    )(sourceValue.values);
}
