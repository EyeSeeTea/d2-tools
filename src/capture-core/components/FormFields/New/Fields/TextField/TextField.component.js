//
import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import { TextField as UITextField } from "capture-ui";

const getStyles = theme => ({
    inputWrapperFocused: {
        border: `2px solid ${theme.palette.primary.light}`,
        borderRadius: "5px",
    },
    inputWrapperUnfocused: {
        padding: 2,
    },
});

class TextFieldPlain extends Component {
    handleChange = event => {
        this.props.onChange && this.props.onChange(event.currentTarget.value, event);
    };

    handleBlur = event => {
        this.props.onBlur && this.props.onBlur(event.currentTarget.value, event);
    };

    render() {
        const { value, onBlur, onChange, classes, ...passOnProps } = this.props;

        return (
            // $FlowFixMe[cannot-spread-inexact] automated comment
            <UITextField
                value={value || ""}
                onChange={this.handleChange}
                onBlur={this.handleBlur}
                classes={classes}
                {...passOnProps}
            />
        );
    }
}

export const TextField = withStyles(getStyles)(TextFieldPlain);
