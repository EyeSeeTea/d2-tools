//
import log from "loglevel";
import { errorCreator } from "capture-core-utils";
import {} from "../../../../../metaData";
import { filterTypesObject } from "../../../WorkingListsBase";
import {
    convertText,
    convertDate,
    convertAssignee,
    convertOptionSet,
    convertBoolean,
    convertNumeric,
    convertTrueOnly,
} from "./filterConverters";

const mappersForTypes = {
    [filterTypesObject.TEXT]: convertText,
    [filterTypesObject.NUMBER]: convertNumeric,
    [filterTypesObject.INTEGER]: convertNumeric,
    [filterTypesObject.INTEGER_POSITIVE]: convertNumeric,
    [filterTypesObject.INTEGER_NEGATIVE]: convertNumeric,
    [filterTypesObject.INTEGER_ZERO_OR_POSITIVE]: convertNumeric,
    [filterTypesObject.DATE]: convertDate,
    [filterTypesObject.ASSIGNEE]: convertAssignee,
    [filterTypesObject.BOOLEAN]: convertBoolean,
    [filterTypesObject.TRUE_ONLY]: convertTrueOnly,
};

function convertFilter(sourceValue, type, meta) {
    if (sourceValue && sourceValue.usingOptionSet) {
        return convertOptionSet(sourceValue, type);
    }
    return mappersForTypes[type]
        ? mappersForTypes[type](sourceValue, meta.key, meta.storeId, meta.isInit)
        : sourceValue;
}
export const buildFilterQueryArgs = (filters, { columns, filtersOnly, storeId, isInit = false }) =>
    Object.keys(filters)
        .filter(key => filters[key])
        .reduce((acc, key) => {
            const { type } = columns.get(key) || (filtersOnly && filtersOnly.get(key)) || {};
            if (!type) {
                log.error(errorCreator("Could not get type for key")({ key, storeId }));
            } else {
                const sourceValue = filters[key];
                const queryArgValue = convertFilter(sourceValue, type, {
                    key,
                    storeId,
                    isInit,
                });
                acc[key] = queryArgValue;
            }
            return acc;
        }, {});
