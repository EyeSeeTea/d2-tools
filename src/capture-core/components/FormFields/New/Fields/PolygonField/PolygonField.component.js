//
import * as React from "react";
import withStyles from "@material-ui/core/styles/withStyles";
import { PolygonField as UIPolygonField } from "capture-ui";
import { Dialog, DialogTitle } from "@material-ui/core";
import {} from "../../../New";

const getStyles = theme => ({
    inputWrapperFocused: {
        border: `2px solid ${theme.palette.primary.light}`,
        borderRadius: "5px",
    },
    inputWrapperUnfocused: {
        padding: 2,
    },
    dialogPaper: {
        maxWidth: "none",
        width: "75%",
        height: "75%",
    },
});

class PolygonFieldPlain extends React.Component {
    constructor(props) {
        super(props);

        const { dialogPaper, ...passOnClasses } = props.classes;
        this.passOnClasses = passOnClasses;
        this.dialogClasses = {
            paper: props.classes.dialogPaper,
        };
    }

    render() {
        const { classes, dialogLabel, ...passOnProps } = this.props;
        return (
            // $FlowFixMe[cannot-spread-inexact] automated comment
            <UIPolygonField
                mapDialog={
                    <Dialog classes={this.dialogClasses}>
                        <DialogTitle key="title">{dialogLabel}</DialogTitle>
                    </Dialog>
                }
                {...passOnProps}
            />
        );
    }
}

export const PolygonField = withStyles(getStyles)(PolygonFieldPlain);
