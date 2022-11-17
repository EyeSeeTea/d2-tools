//
import { convertToClientTeis } from "./convertToClientTeis";
import { getTeisWithSubvalues } from "./getTeisWithSubvalues";

const getApiFilterQueryArgs = (filters = {}, filtersOnlyMetaForDataFetching) => {
    const apiFilterQueryArgs = Object.keys(filters)
        .filter(filterKey => !filtersOnlyMetaForDataFetching.get(filterKey))
        .flatMap(filterKey => {
            const filter = filters[filterKey];
            if (Array.isArray(filter)) {
                return filter.map(filterPart => `${filterKey}:${filterPart}`);
            }
            return `${filterKey}:${filter}`;
        });

    return apiFilterQueryArgs.length > 0 ? { filter: apiFilterQueryArgs } : null;
};

const getMainApiFilterQueryArgs = (filters = {}, filtersOnlyMetaForDataFetching) =>
    Object.keys(filters)
        .filter(filterKey => filtersOnlyMetaForDataFetching.get(filterKey))
        .reduce((acc, filterKey) => {
            const filter = filters[filterKey];
            const { transformRecordsFilter } = filtersOnlyMetaForDataFetching.get(filterKey) || {};
            return {
                ...acc,
                ...transformRecordsFilter(filter),
            };
        }, {});

const createApiQueryArgs = (
    { page, pageSize, programId: program, orgUnitId: orgUnit, filters, sortById, sortByDirection },
    columnsMetaForDataFetching,
    filtersOnlyMetaForDataFetching
) => ({
    ...getApiFilterQueryArgs(filters, filtersOnlyMetaForDataFetching),
    ...getMainApiFilterQueryArgs(filters, filtersOnlyMetaForDataFetching),
    order: `${sortById}:${sortByDirection}`,
    page,
    pageSize,
    orgUnit,
    ouMode: orgUnit ? "SELECTED" : "ACCESSIBLE",
    program,
    fields: ":all,programOwners[orgUnit,program]",
});

export const getTeiListData = async (
    rawQueryArgs,
    { columnsMetaForDataFetching, filtersOnlyMetaForDataFetching, querySingleResource, absoluteApiPath }
) => {
    const { resource, queryArgs } = {
        resource: "tracker/trackedEntities",
        queryArgs: createApiQueryArgs(
            rawQueryArgs,
            columnsMetaForDataFetching,
            filtersOnlyMetaForDataFetching
        ),
    };

    const { instances: apiTeis = [] } = await querySingleResource({
        resource,
        params: queryArgs,
    });
    const columnsMetaForDataFetchingArray = [...columnsMetaForDataFetching.values()];
    const clientTeis = convertToClientTeis(apiTeis, columnsMetaForDataFetchingArray, rawQueryArgs.programId);
    const clientTeisWithSubvalues = await getTeisWithSubvalues(querySingleResource, absoluteApiPath)(
        clientTeis,
        columnsMetaForDataFetchingArray
    );

    return {
        teis: clientTeisWithSubvalues,
        request: {
            resource,
            queryArgs,
        },
    };
};
