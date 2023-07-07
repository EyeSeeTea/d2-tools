//
import React, { useMemo, memo } from "react";

import { FilterButtonMain } from "./FilterButtonMain.component";
import { buildButtonText } from "./buttonTextBuilder";

export const FilterButtonTextBuilder = memo(({ filterValue, type, options, ...passOnProps }) => {
    const buttonText = useMemo(() => {
        if (!filterValue) {
            return filterValue;
        }
        return buildButtonText(filterValue, type, options);
    }, [filterValue, type, options]);

    return (
        <FilterButtonMain
            {...passOnProps}
            filterValue={filterValue}
            type={type}
            options={options}
            buttonText={buttonText}
        />
    );
});
