//
import { getApiEventFilters } from "../helpers/eventFilters";

export const getTemplates = (programId, querySingleResource) =>
    getApiEventFilters(programId, querySingleResource).then(apiEventFilters => {
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
        };

        return {
            templates: [
                defaultTemplate,
                ...apiEventFilters.map(apiEventFilter => {
                    const { displayColumnOrder, order, eventDate } = apiEventFilter.eventQueryCriteria;
                    const convertedEventQueryCriteria = {
                        ...apiEventFilter.eventQueryCriteria,
                        displayColumnOrder: displayColumnOrder?.map(columnId =>
                            columnId === "eventDate" ? "occurredAt" : columnId
                        ),
                        order: order?.includes("eventDate")
                            ? order.replace("eventDate", "occurredAt")
                            : order,
                        occurredAt: eventDate,
                    };

                    return {
                        ...apiEventFilter,
                        criteria: convertedEventQueryCriteria,
                        eventQueryCriteria: undefined,
                    };
                }),
            ],
            defaultTemplateId: defaultTemplate.id,
        };
    });
