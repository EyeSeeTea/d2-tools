//
import * as React from "react";
import { withStyles } from "@material-ui/core/styles";

const getStyles = theme => ({
    errorContainer: {
        margin: 20,
        color: theme.palette.error.main,
    },
});

export const withErrorMessageHandler = () => InnerComponent =>
    withStyles(getStyles)(props => {
        const { error, classes, ...passOnProps } = props;

        if (error) {
            return (
                <div data-test="error-message-handler" className={classes.errorContainer}>
                    {error}
                </div>
            );
        }

        return <InnerComponent {...passOnProps} />;
    });
