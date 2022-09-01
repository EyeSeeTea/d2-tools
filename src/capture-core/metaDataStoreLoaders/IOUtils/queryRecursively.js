//

import { query } from "./query";

const executeRecursiveQuery = (recursiveQuery, convertQueryResponse) => {
    const next = async (page = 1) => {
        // $FlowFixMe union type problem
        const response = await query(recursiveQuery, { page });
        const convertedData = convertQueryResponse ? convertQueryResponse(response) : response;
        const done = !(response && response.pager && response.pager.nextPage);

        if (!done) {
            const innerResult = await next(page + 1);
            return [convertedData, ...innerResult];
        }
        return [convertedData];
    };

    return next();
};

const getRecursiveQuery = (querySpec, pageSize) => ({
    ...querySpec,
    params: variables => ({
        ...querySpec.params,
        pageSize,
        page: variables.page,
    }),
});

export const queryRecursively = (querySpec, { pageSize = 500, convertQueryResponse } = {}) => {
    const recursiveQuery = getRecursiveQuery(querySpec, pageSize);
    return executeRecursiveQuery(recursiveQuery, convertQueryResponse);
};
