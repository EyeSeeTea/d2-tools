//
import React, { useMemo } from "react";
import { ListViewBuilderContext } from "../../workingListsBase.context";

export const WorkingListsListViewBuilderContextProvider = ({
    updating,
    updatingWithDialog,
    dataSource,
    onSelectListRow,
    onSortList,
    onSetListColumnOrder,
    customRowMenuContents,
    onUpdateFilter,
    onClearFilter,
    onSelectRestMenuItem,
    onChangePage,
    onChangeRowsPerPage,
    stickyFilters,
    children,
}) => {
    const listViewBuilderContextData = useMemo(
        () => ({
            updating,
            updatingWithDialog,
            dataSource,
            onSelectListRow,
            onSortList,
            onSetListColumnOrder,
            customRowMenuContents,
            onUpdateFilter,
            onClearFilter,
            onSelectRestMenuItem,
            onChangePage,
            onChangeRowsPerPage,
            stickyFilters,
        }),
        [
            updating,
            updatingWithDialog,
            dataSource,
            onSelectListRow,
            onSortList,
            onSetListColumnOrder,
            customRowMenuContents,
            onUpdateFilter,
            onClearFilter,
            onSelectRestMenuItem,
            onChangePage,
            onChangeRowsPerPage,
            stickyFilters,
        ]
    );

    return (
        <ListViewBuilderContext.Provider value={listViewBuilderContextData}>
            {children}
        </ListViewBuilderContext.Provider>
    );
};
