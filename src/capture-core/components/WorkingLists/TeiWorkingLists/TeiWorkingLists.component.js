//
import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import { TeiWorkingListsReduxProvider } from "./ReduxProvider";

import { TEI_WORKING_LISTS_STORE_ID } from "./constants";

const getStyles = ({ typography }) => ({
    listContainer: {
        padding: typography.pxToRem(24),
    },
});

const TeiWorkingListsPlain = ({ classes: { listContainer }, ...passOnProps }) => (
    <div data-test="tei-working-lists">
        <Paper className={listContainer}>
            <TeiWorkingListsReduxProvider storeId={TEI_WORKING_LISTS_STORE_ID} {...passOnProps} />
        </Paper>
    </div>
);

export const TeiWorkingLists = withStyles(getStyles)(TeiWorkingListsPlain);
