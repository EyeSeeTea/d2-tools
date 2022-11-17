//
import log from "loglevel";
import { errorCreator, pipe } from "capture-core-utils";
import moment from "moment";
import {} from "../../../../../../metaData";
import { getApiOptionSetFilter } from "./optionSet";

import { filterTypesObject, dateFilterTypes } from "../../../../WorkingListsBase";

const getTextFilter = filter => ({
    like: filter.value,
});

const getNumericFilter = filter => ({
    ge: filter.ge ? filter.ge.toString() : undefined,
    le: filter.le ? filter.le.toString() : undefined,
});

const getBooleanFilter = filter => ({
    in: filter.values.map(value => (value ? "true" : "false")),
});

const getTrueOnlyFilter = () => ({
    eq: "true",
});

const convertDate = rawValue => {
    const momentDate = moment(rawValue);
    momentDate.locale("en");
    return momentDate.format("YYYY-MM-DD");
};

const getDateFilter = dateFilter => {
    const apiDateFilterContents =
        dateFilter.type === dateFilterTypes.RELATIVE
            ? {
                  type: dateFilter.type,
                  period: dateFilter.period,
                  startBuffer: dateFilter.startBuffer,
                  endBuffer: dateFilter.endBuffer,
              }
            : {
                  type: dateFilter.type,
                  startDate: dateFilter.ge ? convertDate(dateFilter.ge) : undefined,
                  endDate: dateFilter.le ? convertDate(dateFilter.le) : undefined,
              };

    return {
        dateFilter: apiDateFilterContents,
    };
};

const getAssigneeFilter = filter => ({
    assignedUserMode: filter.assignedUserMode,
    assignedUsers: filter.assignedUser ? [filter.assignedUser.id] : undefined,
});

const getFilterByType = {
    [filterTypesObject.TEXT]: getTextFilter,
    [filterTypesObject.NUMBER]: getNumericFilter,
    [filterTypesObject.INTEGER]: getNumericFilter,
    [filterTypesObject.INTEGER_POSITIVE]: getNumericFilter,
    [filterTypesObject.INTEGER_NEGATIVE]: getNumericFilter,
    [filterTypesObject.INTEGER_ZERO_OR_POSITIVE]: getNumericFilter,
    [filterTypesObject.DATE]: getDateFilter,
    [filterTypesObject.BOOLEAN]: getBooleanFilter,
    [filterTypesObject.TRUE_ONLY]: getTrueOnlyFilter,
    [filterTypesObject.ASSIGNEE]: getAssigneeFilter,
};

const typeConvertFilters = (filters, columns) =>
    Object.keys(filters)
        .map(key => {
            const filter = filters[key];
            if (filter == null) {
                return null;
            }
            const element = columns.get(key);
            // $FlowFixMe I accept that not every type is listed, thats why I'm doing this test
            if (!element || !getFilterByType[element.type]) {
                log.error(
                    errorCreator(
                        "tried to convert a filter to api value, but there was no filter converter or specification found"
                    )({
                        filter,
                        element,
                    })
                );
                return null;
            }

            if (filter.usingOptionSet) {
                return {
                    ...getApiOptionSetFilter(filter, element.type),
                    dataItem: key,
                };
            }

            return {
                // $FlowFixMe I accept that not every type is listed, thats why I'm doing this test
                ...getFilterByType[element.type](filter),
                dataItem: key,
            };
        })
        .filter(value => value != null);

const getMainFilter = filter => {
    let mainValue;
    const { dataItem, ...filterValues } = filter;
    switch (dataItem) {
        case "status":
            mainValue = {
                status: filterValues.in[0],
            };
            break;
        case "occurredAt":
            mainValue = {
                eventDate: filterValues.dateFilter,
            };
            break;
        case "assignee":
            mainValue = filterValues;
            break;
        default:
            mainValue = null;
            break;
    }
    return mainValue;
};

const structureFilters = (apiFilters, columns) =>
    apiFilters.reduce(
        (acc, filter) => {
            const element = columns.get(filter.dataItem);

            // $FlowFixMe[incompatible-type] automated comment
            if (element.isMainProperty) {
                const mainFilter = getMainFilter(filter);
                const filters = {
                    ...acc,
                    ...mainFilter,
                };
                return filters;
            }

            acc.dataFilters.push(filter);
            return acc;
        },
        {
            dataFilters: [],
        }
    );

const getSortOrder = (sortById, sortByDirection) =>
    `${sortById === "occurredAt" ? "eventDate" : sortById}:${sortByDirection}`;

const getColumnsOrder = columns =>
    columns.filter(column => column.visible).map(column => column.apiName || column.id);

export const convertToEventFilterEventQueryCriteria = ({ filters, sortById, sortByDirection, columns }) => {
    const sortOrderCriteria = getSortOrder(sortById, sortByDirection);
    const filtersCriteria = pipe(
        () => typeConvertFilters(filters, columns),
        convertedFilters => structureFilters(convertedFilters, columns)
    )();
    const displayColumnOrderCriteria = getColumnsOrder([...columns.values()])?.map(column =>
        column === "occurredAt" ? "eventDate" : column
    );

    return {
        ...filtersCriteria,
        order: sortOrderCriteria,
        displayColumnOrder: displayColumnOrderCriteria,
    };
};
