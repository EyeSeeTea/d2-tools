//
import { quickStore } from "./quickStore";

const quickStoreIteration = async (recursiveQuery, storeName, { convertQueryResponse, queryVariables }) => {
    const { rawResponse } = await quickStore(
        {
            // $FlowFixMe union type problem
            query: recursiveQuery,
            storeName,
            convertQueryResponse,
        },
        {
            queryVariables,
        }
    );

    return !(rawResponse && rawResponse.pager && rawResponse.pager.nextPage);
};

const executeRecursiveQuickStore = (recursiveQuery, storeName, convertQueryResponse) => {
    const next = async (iteration = 1) => {
        const done = await quickStoreIteration(recursiveQuery, storeName, {
            convertQueryResponse,
            queryVariables: {
                iteration,
            },
        });

        if (!done) {
            await next(iteration + 1);
        }
    };

    return next();
};

const getRecursiveQuery = (query, iterationSize) => ({
    ...query,
    params: queryVariables => ({
        ...query.params,
        pageSize: iterationSize,
        page: queryVariables.iteration,
    }),
});

export const quickStoreRecursively = (
    { query, storeName, convertQueryResponse },
    { iterationSize = 500 } = {}
) => {
    const recursiveQuery = getRecursiveQuery(query, iterationSize);
    return executeRecursiveQuickStore(recursiveQuery, storeName, convertQueryResponse);
};
