//
import moment from "moment";
import { parseNumber } from "capture-core-utils/parsers";
import { dataElementTypes } from "../../../../../../metaData";

const converterByType = {
    [dataElementTypes.NUMBER]: parseNumber,
    [dataElementTypes.INTEGER]: parseNumber,
    [dataElementTypes.INTEGER_POSITIVE]: parseNumber,
    [dataElementTypes.INTEGER_ZERO_OR_POSITIVE]: parseNumber,
    [dataElementTypes.INTEGER_NEGATIVE]: parseNumber,
    [dataElementTypes.DATE]: rawValue => moment(rawValue, "YYYY-MM-DD").toISOString(),
    [dataElementTypes.BOOLEAN]: rawValue => rawValue === "true",
    [dataElementTypes.TRUE_ONLY]: rawValue => rawValue === "true" || null,
};

export const getOptionSetFilter = (filter, type) => ({
    usingOptionSet: true,
    values: filter.in
        // $FlowFixMe dataElementTypes flow error
        .map(value => (converterByType[type] ? converterByType[type](value) : value)),
});
