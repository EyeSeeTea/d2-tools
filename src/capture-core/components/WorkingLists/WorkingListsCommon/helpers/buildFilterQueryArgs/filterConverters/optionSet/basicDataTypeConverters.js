//
import moment from "moment";
import { dataElementTypes } from "../../../../../../../metaData";

const stringifyNumber = rawValue => rawValue.toString();

function convertDate(isoString) {
    const momentDate = moment(isoString);
    momentDate.locale("en");
    return momentDate.format("YYYY-MM-DD");
}

const valueConvertersForType = {
    [dataElementTypes.NUMBER]: stringifyNumber,
    [dataElementTypes.INTEGER]: stringifyNumber,
    [dataElementTypes.INTEGER_POSITIVE]: stringifyNumber,
    [dataElementTypes.INTEGER_ZERO_OR_POSITIVE]: stringifyNumber,
    [dataElementTypes.INTEGER_NEGATIVE]: stringifyNumber,
    [dataElementTypes.DATE]: convertDate,
    [dataElementTypes.TRUE_ONLY]: () => "true",
    [dataElementTypes.BOOLEAN]: rawValue => (rawValue ? "true" : "false"),
    [dataElementTypes.FILE_RESOURCE]: rawValue => rawValue.value,
    [dataElementTypes.IMAGE]: rawValue => rawValue.value,
    [dataElementTypes.COORDINATE]: rawValue => `[${rawValue.longitude},${rawValue.latitude}]`,
    [dataElementTypes.PERCENTAGE]: rawValue => rawValue.replace("%", ""),
    [dataElementTypes.ORGANISATION_UNIT]: rawValue => rawValue.id,
};

export function convertDataTypeValueToRequest(value, type) {
    // $FlowFixMe dataElementTypes flow error
    return valueConvertersForType[type] ? valueConvertersForType[type](value) : value;
}
