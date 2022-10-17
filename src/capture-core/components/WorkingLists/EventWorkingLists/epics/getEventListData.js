//
import { getEvents } from "../../../../events/eventRequests";

const mapArgumentNameFromClientToServer = {
    programId: "program",
    programStageId: "programStage",
    orgUnitId: "orgUnit",
    rowsPerPage: "pageSize",
    currentPage: "page",
};

const getMainColumns = columnsMetaForDataFetching =>
    [...columnsMetaForDataFetching.values()].reduce((accMainColumns, column) => {
        if (column.isMainProperty) {
            accMainColumns[column.id] = column;
        }
        return accMainColumns;
    }, {});

const getFilter = filterContainer => filterContainer;

const getApiFilterQueryArgument = (filters, mainColumns) => {
    const filterQueries = filters
        ? Object.keys(filters)

              .filter(key => filters[key] != null && !mainColumns[key])
              .reduce((accFilterQueries, filterKey) => {
                  const filter = getFilter(filters[filterKey]);
                  if (Array.isArray(filter)) {
                      const filtersFromArray = filter.map(filterPart => `${filterKey}:${filterPart}`);
                      accFilterQueries = [...accFilterQueries, ...filtersFromArray];
                  } else {
                      accFilterQueries.push(`${filterKey}:${filter}`);
                  }
                  return accFilterQueries;
              }, [])
        : null;

    const filterArgument = filterQueries && filterQueries.length > 0 ? { filter: filterQueries } : null;
    return filterArgument;
};

const getEventDateQueryArgs = filter => {
    const eventDateQueryArgs = {};
    const filterParts = filter.split(":");
    const indexGe = filterParts.indexOf("ge");
    const indexLe = filterParts.indexOf("le");

    if (indexGe !== -1 && filterParts[indexGe + 1]) {
        eventDateQueryArgs.occurredAfter = filterParts[indexGe + 1];
    }
    if (indexLe !== -1 && filterParts[indexLe + 1]) {
        eventDateQueryArgs.occurredBefore = filterParts[indexLe + 1];
    }
    return eventDateQueryArgs;
};

const getStatusQueryArgs = filter => {
    const statusQueryArgs = {
        status: filter.replace("in:", ""),
    };
    return statusQueryArgs;
};

const getMainApiFilterQueryArguments = (filters, mainColumns) => {
    const mainFilterQueryArgs = filters
        ? Object.keys(filters)

              .filter(key => mainColumns[key] && filters[key] != null)
              .reduce((accMainQueryArgs, key) => {
                  const filter = getFilter(filters[key]);
                  let queryArgsForCurrentMain = {};
                  if (key === "occurredAt") {
                      queryArgsForCurrentMain = getEventDateQueryArgs(filter);
                  } else if (key === "status") {
                      queryArgsForCurrentMain = getStatusQueryArgs(filter);
                  } else if (key === "assignee") {
                      queryArgsForCurrentMain = filter;
                  }
                  return {
                      // $FlowFixMe[exponential-spread] automated comment
                      ...accMainQueryArgs,
                      ...queryArgsForCurrentMain,
                  };
              }, {})
        : null;

    return mainFilterQueryArgs;
};

const getApiCategoriesQueryArgument = (categories, categoryCombinationId) => {
    if (!categories || !categoryCombinationId) {
        return null;
    }

    return {
        attributeCc: categoryCombinationId,
        attributeCos: Object.keys(categories)

            .map(key => categories[key])
            .join(";"),
    };
};

const getApiOrderById = (sortById, mainColumns) => {
    if (mainColumns[sortById]) {
        const columnSpec = mainColumns[sortById];
        if (columnSpec.apiName) {
            return columnSpec.apiName;
        }
    }
    return sortById;
};

const getApiOrderByQueryArgument = (sortById, sortByDirection, mainColumns) => {
    const apiId = getApiOrderById(sortById, mainColumns);
    return `${apiId}:${sortByDirection}`;
};

// eslint-disable-next-line complexity
const createApiQueryArgs = (queryArgs, mainColumns, categoryCombinationId) => {
    let apiQueryArgs = {
        ...queryArgs,
        order: getApiOrderByQueryArgument(queryArgs.sortById, queryArgs.sortByDirection, mainColumns),
        ...getApiFilterQueryArgument(queryArgs.filters, mainColumns),
        // $FlowFixMe[exponential-spread] automated comment
        ...getMainApiFilterQueryArguments(queryArgs.filters, mainColumns),
        ...getApiCategoriesQueryArgument(queryArgs.categories, categoryCombinationId),
    };
    apiQueryArgs.hasOwnProperty("categories") && delete apiQueryArgs.categories;
    apiQueryArgs.hasOwnProperty("sortById") && delete apiQueryArgs.sortById;
    apiQueryArgs.hasOwnProperty("sortByDirection") && delete apiQueryArgs.sortByDirection;
    apiQueryArgs.hasOwnProperty("filters") && delete apiQueryArgs.filters;

    apiQueryArgs = Object.keys(apiQueryArgs).reduce((acc, key) => {
        const value = apiQueryArgs[key];
        if (value !== undefined) {
            acc[key] = value;
        }
        return acc;
    }, {});

    const apiQueryArgsWithServerPropName = Object.keys(apiQueryArgs).reduce((accApiQueryArgs, key) => {
        if (mapArgumentNameFromClientToServer[key]) {
            accApiQueryArgs[mapArgumentNameFromClientToServer[key]] = apiQueryArgs[key];
        } else {
            accApiQueryArgs[key] = apiQueryArgs[key];
        }
        return accApiQueryArgs;
    }, {});

    return apiQueryArgsWithServerPropName;
};

export const getEventListData = async (queryArgs, columnsMetaForDataFetching, categoryCombinationId) => {
    const mainColumns = getMainColumns(columnsMetaForDataFetching);

    const { eventContainers, pagingData, request } = await getEvents(
        createApiQueryArgs(queryArgs, mainColumns, categoryCombinationId)
    );
    const columnKeys = [...columnsMetaForDataFetching.keys()];
    const columnFilteredEventContainers = eventContainers
        .map(({ id, event, values }) => ({ id, record: { ...event, ...values } }))
        .map(({ id, record }) => ({
            id,
            record: columnKeys.reduce((acc, columnId) => {
                acc[columnId] = record[columnId];
                return acc;
            }, {}),
        }));

    return {
        eventContainers: columnFilteredEventContainers,
        pagingData,
        request,
    };
};
