//
import * as React from "react";
import { withStyles } from "@material-ui/core/styles";

const styles = theme => ({
    borderBox: {
        borderRadius: theme.typography.pxToRem(6),
        borderWidth: theme.typography.pxToRem(2),
        borderColor: "#e0e0e0",
        borderStyle: "solid",
    },
});

const BorderBoxPlain = props => {
    const { classes, children, contentClassName } = props;
    return (
        <div className={classes.borderBox}>
            <div className={contentClassName}>{children}</div>
        </div>
    );
};

export const BorderBox = withStyles(styles)(BorderBoxPlain);
