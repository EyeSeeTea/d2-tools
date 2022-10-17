//
import React, { useMemo } from "react";
import { ListViewUpdaterContext } from "../../workingListsBase.context";

export const WorkingListsListViewUpdaterContextProvider = ({
    rowsPerPage,
    currentPage,
    onCancelUpdateList,
    customUpdateTrigger,
    forceUpdateOnMount,
    dirtyList,
    children,
}) => {
    const listViewUpdaterContextData = useMemo(
        () => ({
            rowsPerPage,
            currentPage,
            onCancelUpdateList,
            customUpdateTrigger,
            forceUpdateOnMount,
            dirtyList,
        }),
        [rowsPerPage, currentPage, onCancelUpdateList, customUpdateTrigger, forceUpdateOnMount, dirtyList]
    );

    return (
        <ListViewUpdaterContext.Provider value={listViewUpdaterContextData}>
            {children}
        </ListViewUpdaterContext.Provider>
    );
};
