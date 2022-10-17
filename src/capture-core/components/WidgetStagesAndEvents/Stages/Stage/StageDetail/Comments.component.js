//
import React from "react";
import { IconMessages16 } from "@dhis2/ui";
import { withStyles } from "@material-ui/core";

const styles = {
    wrapper: {
        display: "flex",
        alignItems: "center",
    },
    text: {
        paddingLeft: "2px",
    },
};
export const CommentsPlain = ({ event, classes }) => {
    const commentsCount = event.notes?.length;

    return commentsCount ? (
        <div className={classes.wrapper}>
            <IconMessages16 />
            <span className={classes.text}>{commentsCount}</span>
        </div>
    ) : null;
};

export const Comments = withStyles(styles)(CommentsPlain);
