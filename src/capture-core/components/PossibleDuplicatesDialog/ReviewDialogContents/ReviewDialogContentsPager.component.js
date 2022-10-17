//
import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { Pagination } from "capture-ui";
import { withNavigation } from "../../Pagination/withDefaultNavigation";

import { useDuplicates } from "../useDuplicates";

const Pager = withNavigation()(Pagination);

const getStyles = theme => ({
    container: {
        display: "flex",
        justifyContent: "flex-end",
        marginLeft: theme.typography.pxToRem(8),
        maxWidth: theme.typography.pxToRem(600),
    },
});

const ReviewDialogContentsPagerPlain = ({
    currentPage,
    nextPageButtonDisabled,
    selectedScopeId,
    dataEntryId,
    classes,
}) => {
    const { changePageOnReviewDuplicates } = useDuplicates(dataEntryId, selectedScopeId);

    return (
        <div className={classes.container}>
            <Pager
                currentPage={currentPage}
                onChangePage={changePageOnReviewDuplicates}
                nextPageButtonDisabled={nextPageButtonDisabled}
            />
        </div>
    );
};

export const ReviewDialogContentsPagerComponent = withStyles(getStyles)(ReviewDialogContentsPagerPlain);
