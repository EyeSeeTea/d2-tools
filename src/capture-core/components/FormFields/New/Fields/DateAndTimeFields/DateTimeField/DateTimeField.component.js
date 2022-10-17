//
import * as React from "react";
import { withStyles, withTheme } from "@material-ui/core/styles";
import { DateTimeField as UIDateTimeField } from "capture-ui";
import { withCalendarProps } from "../../../HOC/withCalendarProps";

const getStyles = theme => ({
    inputWrapperFocused: {
        border: `2px solid ${theme.palette.primary.light}`,
        borderRadius: "5px",
    },
    inputWrapperUnfocused: {
        padding: 2,
    },
    innerInputError: {
        color: theme.palette.error.main,
        padding: theme.typography.pxToRem(3),
        fontSize: theme.typography.pxToRem(12),
    },
    innerInputWarning: {
        color: theme.palette.warning.dark,
        padding: theme.typography.pxToRem(3),
        fontSize: theme.typography.pxToRem(12),
    },
    innerInputInfo: {
        color: "green",
        padding: theme.typography.pxToRem(3),
        fontSize: theme.typography.pxToRem(12),
    },
    innerInputValidating: {
        color: "orange",
        padding: theme.typography.pxToRem(3),
        fontSize: theme.typography.pxToRem(12),
    },
});

class DateTimeFieldPlain extends React.Component {
    render() {
        const { ...passOnProps } = this.props;
        return <UIDateTimeField {...passOnProps} />;
    }
}

export const DateTimeField = withTheme()(withCalendarProps()(withStyles(getStyles)(DateTimeFieldPlain)));
