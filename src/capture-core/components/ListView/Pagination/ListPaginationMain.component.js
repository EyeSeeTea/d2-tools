//
import * as React from "react";
import i18n from "@dhis2/d2-i18n";
import { Pagination } from "capture-ui";
import { withNavigation } from "../../Pagination/withDefaultNavigation";
import { withRowsPerPageSelector } from "../../Pagination/withRowsPerPageSelector";

const PaginationWrapped = withRowsPerPageSelector()(withNavigation()(Pagination));

export const ListPaginationMain = ({ rowCountPage, rowsPerPage, ...passOnProps }) => (
    <PaginationWrapped
        {...passOnProps}
        rowsPerPage={rowsPerPage}
        rowsCountSelectorLabel={i18n.t("Rows per page")}
        nextPageButtonDisabled={!!(rowsPerPage > rowCountPage)}
    />
);
