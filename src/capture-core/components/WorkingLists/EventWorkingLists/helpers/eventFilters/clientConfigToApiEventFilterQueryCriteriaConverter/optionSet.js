//
import moment from "moment";
import { dataElementTypes } from "../../../../../../metaData";

const stringifyNumber = rawValue => rawValue.toString();

const convertDate = rawValue => {
    const momentDate = moment(rawValue);
    momentDate.locale("en");
    return momentDate.format("YYYY-MM-DD");
};

const converterByType = {
    [dataElementTypes.NUMBER]: stringifyNumber,
    [dataElementTypes.INTEGER]: stringifyNumber,
    [dataElementTypes.INTEGER_POSITIVE]: stringifyNumber,
    [dataElementTypes.INTEGER_ZERO_OR_POSITIVE]: stringifyNumber,
    [dataElementTypes.INTEGER_NEGATIVE]: stringifyNumber,
    [dataElementTypes.DATE]: convertDate,
    [dataElementTypes.BOOLEAN]: rawValue => (rawValue ? "true" : "false"),
    [dataElementTypes.TRUE_ONLY]: () => "true",
};

export const getApiOptionSetFilter = (filter, type) => ({
    in: filter.values
        // $FlowFixMe dataElementTypes flow error
        .map(value => (converterByType[type] ? converterByType[type](value) : value.toString())),
});
