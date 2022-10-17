//
import React, { useMemo } from "react";
import { ListViewLoaderContext } from "../../workingListsBase.context";

export const WorkingListsListViewLoaderContextProvider = ({
    sortById,
    sortByDirection,
    filters,
    columns,
    loading,
    onLoadView,
    loadViewError,
    onUpdateList,
    onCancelLoadView,
    orgUnitId,
    categories,
    dirtyView,
    loadedViewContext,
    viewPreloaded,
    children,
}) => {
    const listViewLoaderContextData = useMemo(
        () => ({
            sortById,
            sortByDirection,
            filters,
            columns,
            loading,
            onLoadView,
            loadViewError,
            onUpdateList,
            onCancelLoadView,
            orgUnitId,
            categories,
            dirtyView,
            loadedViewContext,
            viewPreloaded,
        }),
        [
            sortById,
            sortByDirection,
            filters,
            columns,
            loading,
            onLoadView,
            loadViewError,
            onUpdateList,
            onCancelLoadView,
            orgUnitId,
            categories,
            dirtyView,
            loadedViewContext,
            viewPreloaded,
        ]
    );

    return (
        <ListViewLoaderContext.Provider value={listViewLoaderContextData}>
            {children}
        </ListViewLoaderContext.Provider>
    );
};
