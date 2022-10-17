//

export const getApiEventFilters = async (programId, querySingleResource) => {
    const apiRes = await querySingleResource({
        resource: "eventFilters",
        params: {
            filter: `program:eq:${programId}`,
            fields: "id,displayName,eventQueryCriteria,access,externalAccess,publicAccess,user[id,username],userAccesses[id,access],userGroupAccesses[id,access]",
        },
    });

    const configs = apiRes && apiRes.eventFilters ? apiRes.eventFilters : [];
    const processedConfigs = configs.map(
        ({
            id,
            displayName: name,
            eventQueryCriteria,
            access,
            externalAccess,
            publicAccess,
            user,
            userAccesses,
            userGroupAccesses,
        }) => ({
            id,
            name,
            eventQueryCriteria,
            access,
            externalAccess,
            publicAccess,
            user,
            userAccesses,
            userGroupAccesses,
        })
    );

    return processedConfigs;
};
