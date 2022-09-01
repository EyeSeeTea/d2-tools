//
import * as React from "react";

import MuiButton from "@material-ui/core/Button";
import { withStyles } from "@material-ui/core/styles";

const styles = () => ({
    button: {},
    contents: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
});

const ButtonPlain = props => {
    const { classes, children, muiClasses, muiButtonRef, ...passOnProps } = props;
    const buttonRefPropObject = muiButtonRef ? { buttonRef: muiButtonRef } : null;

    return (
        // $FlowFixMe[cannot-spread-inexact] automated comment
        <MuiButton {...buttonRefPropObject} className={classes.button} classes={muiClasses} {...passOnProps}>
            <div className={classes.contents}>{children}</div>
        </MuiButton>
    );
};

export const Button = withStyles(styles)(ButtonPlain);
