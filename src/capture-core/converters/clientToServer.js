//
import moment from "moment";
import { dataElementTypes } from "../metaData";
import { stringifyNumber } from "./common/stringifyNumber";

function convertDate(rawValue) {
    const editedDate = rawValue;
    const momentDate = moment(editedDate);
    momentDate.locale("en");
    return momentDate.format("YYYY-MM-DD");
}

function convertRange(parser, rangeValue) {
    return {
        from: parser(rangeValue.from),
        to: parser(rangeValue.to),
    };
}

const valueConvertersForType = {
    [dataElementTypes.NUMBER]: stringifyNumber,
    [dataElementTypes.NUMBER_RANGE]: value => convertRange(stringifyNumber, value),
    [dataElementTypes.INTEGER]: stringifyNumber,
    [dataElementTypes.INTEGER_RANGE]: value => convertRange(stringifyNumber, value),
    [dataElementTypes.INTEGER_POSITIVE]: stringifyNumber,
    [dataElementTypes.INTEGER_POSITIVE_RANGE]: value => convertRange(stringifyNumber, value),
    [dataElementTypes.INTEGER_ZERO_OR_POSITIVE]: stringifyNumber,
    [dataElementTypes.INTEGER_ZERO_OR_POSITIVE_RANGE]: value => convertRange(stringifyNumber, value),
    [dataElementTypes.INTEGER_NEGATIVE]: stringifyNumber,
    [dataElementTypes.INTEGER_NEGATIVE_RANGE]: value => convertRange(stringifyNumber, value),
    [dataElementTypes.DATE]: convertDate,
    [dataElementTypes.DATE_RANGE]: value => convertRange(convertDate, value),
    [dataElementTypes.TRUE_ONLY]: () => "true",
    [dataElementTypes.BOOLEAN]: rawValue => (rawValue ? "true" : "false"),
    [dataElementTypes.FILE_RESOURCE]: rawValue => rawValue.value,
    [dataElementTypes.IMAGE]: rawValue => rawValue.value,
    [dataElementTypes.COORDINATE]: rawValue => `[${rawValue.longitude},${rawValue.latitude}]`,
    [dataElementTypes.PERCENTAGE]: rawValue => rawValue.replace("%", ""),
    [dataElementTypes.ORGANISATION_UNIT]: rawValue => rawValue.id,
    [dataElementTypes.AGE]: rawValue => convertDate(rawValue),
};

export function convertValue(value, type) {
    if (!value && value !== 0 && value !== false) {
        return value;
    }
    // $FlowFixMe dataElementTypes flow error
    return valueConvertersForType[type] ? valueConvertersForType[type](value) : value;
}
