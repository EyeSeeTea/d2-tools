//
import React from "react";
import { useViewHasTemplateChanges } from "../../WorkingListsCommon";
import { EventWorkingListsDataSourceSetup } from "../DataSourceSetup";

export const CurrentViewChangesResolver = ({
    filters,
    columns,
    sortById,
    sortByDirection,
    defaultColumns,
    initialViewConfig,
    ...passOnProps
}) => {
    const viewHasChanges = useViewHasTemplateChanges({
        initialViewConfig,
        defaultColumns,
        filters,
        columns,
        sortById,
        sortByDirection,
    });

    return (
        <EventWorkingListsDataSourceSetup
            {...passOnProps}
            filters={filters}
            columns={columns}
            sortById={sortById}
            sortByDirection={sortByDirection}
            currentViewHasTemplateChanges={viewHasChanges}
        />
    );
};
