//
import React, { useMemo } from "react";
import { FilterValuesContext, PaginationContext } from "../listView.context";
import { ListViewMain } from "../Main";

export const ListViewContextBuilder = ({
    filters,
    onChangePage,
    onChangeRowsPerPage,
    rowsPerPage,
    currentPage,
    dataSource,
    ...passOnProps
}) => {
    const paginationContextData = useMemo(
        () => ({
            onChangePage,
            onChangeRowsPerPage,
            rowsPerPage,
            currentPage,
            rowCountPage: dataSource.length,
        }),
        [onChangePage, onChangeRowsPerPage, rowsPerPage, currentPage, dataSource.length]
    );

    return (
        <FilterValuesContext.Provider value={filters}>
            <PaginationContext.Provider value={paginationContextData}>
                <ListViewMain {...passOnProps} dataSource={dataSource} />
            </PaginationContext.Provider>
        </FilterValuesContext.Provider>
    );
};
