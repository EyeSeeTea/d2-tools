//
import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { IncompleteSelectionsMessage } from "../IncompleteSelectionsMessage";

const styles = () => ({
    header: {
        flexGrow: 1,
        fontSize: 16,
        fontWeight: 500,
    },

    message: {
        marginTop: 10,
    },
});

export const NoWriteAccessMessagePlain = ({ title, message, classes }) => (
    <>
        <div className={classes.header}>{title}</div>
        <div className={classes.message}>
            <IncompleteSelectionsMessage>{message}</IncompleteSelectionsMessage>
        </div>
    </>
);

export const NoWriteAccessMessage = withStyles(styles)(NoWriteAccessMessagePlain);
