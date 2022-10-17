//
import * as React from "react";
import { Filters } from "../Filters";

export const withFilters =
    () =>
    InnerComponent =>
    ({
        columns,
        filtersOnly,
        onUpdateFilter,
        onClearFilter,
        onSelectRestMenuItem,
        stickyFilters,
        ...passOnProps
    }) =>
        (
            <InnerComponent
                {...passOnProps}
                columns={columns}
                filters={
                    <Filters
                        columns={columns}
                        filtersOnly={filtersOnly}
                        onUpdateFilter={onUpdateFilter}
                        onClearFilter={onClearFilter}
                        onSelectRestMenuItem={onSelectRestMenuItem}
                        stickyFilters={stickyFilters}
                    />
                }
            />
        );
