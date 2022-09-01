//

const getApiTEIFilters = async (programId, querySingleResource) => {
    const apiRes = await querySingleResource({
        resource: "trackedEntityInstanceFilters",
        params: {
            filter: `program.id:eq:${programId}`,
            fields: "id,displayName,sortOrder,entityQueryCriteria,access,externalAccess,publicAccess,user,userAccesses,userGroupAccesses",
        },
    });
    return apiRes && apiRes.trackedEntityInstanceFilters ? apiRes.trackedEntityInstanceFilters : [];
};

export const getTemplates = (programId, querySingleResource) =>
    getApiTEIFilters(programId, querySingleResource).then(apiTEIFilters => {
        const defaultTemplate = {
            id: `${programId}-default`,
            isDefault: true,
            name: "default",
            access: {
                update: false,
                delete: false,
                write: false,
                manage: false,
            },
            criteria: {
                order: "createdAt:desc",
            },
        };
        return {
            templates: [
                defaultTemplate,
                ...apiTEIFilters.map(
                    ({
                        displayName,
                        sortOrder,
                        id,
                        access,
                        entityQueryCriteria: {
                            enrollmentStatus,
                            enrollmentCreatedDate,
                            enrollmentIncidentDate,
                            order,
                            attributeValueFilters,
                            displayColumnOrder,
                            assignedUserMode,
                            assignedUsers,
                        } = {},
                        externalAccess,
                        publicAccess,
                        user,
                        userAccesses,
                        userGroupAccesses,
                    }) => ({
                        id,
                        name: displayName,
                        order: sortOrder,
                        criteria: {
                            programStatus: enrollmentStatus,
                            enrolledAt: enrollmentCreatedDate,
                            occurredAt: enrollmentIncidentDate,
                            order,
                            displayColumnOrder,
                            assignedUserMode,
                            assignedUsers,
                            attributeValueFilters,
                        },
                        access,
                        externalAccess,
                        publicAccess,
                        user,
                        userAccesses,
                        userGroupAccesses,
                    })
                ),
            ],
            defaultTemplateId: defaultTemplate.id,
        };
    });
