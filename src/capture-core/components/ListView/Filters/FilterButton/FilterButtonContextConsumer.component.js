//
import React, { useContext } from "react";
import { FilterValuesContext } from "../../listView.context";
import { FilterButtonTextBuilder } from "./FilterButtonTextBuilder.component";

export const FilterButtonContextConsumer = ({ itemId, ...passOnProps }) => {
    const filterValues = useContext(FilterValuesContext);
    const filterValue = (filterValues && filterValues[itemId]) || undefined;

    return (
        // $FlowFixMe fixed in later PR
        <FilterButtonTextBuilder {...passOnProps} itemId={itemId} filterValue={filterValue} />
    );
};
