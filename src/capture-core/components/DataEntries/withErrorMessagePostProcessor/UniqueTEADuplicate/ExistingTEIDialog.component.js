//
import React from "react";
import Dialog from "@material-ui/core/Dialog";
import { ExistingTEILoader } from "./ExistingTEILoader.container";

export const ExistingTEIDialog = props => {
    const { open, ...passOnProps } = props;
    return (
        <Dialog fullWidth maxWidth={"md"} open={open} onClose={props.onCancel}>
            <ExistingTEILoader {...passOnProps} />
        </Dialog>
    );
};
