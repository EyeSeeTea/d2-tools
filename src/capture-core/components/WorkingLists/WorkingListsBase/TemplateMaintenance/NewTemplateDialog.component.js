//
import * as React from "react";
import { Dialog } from "@material-ui/core";
import { NewTemplateContents } from "./NewTemplateContents.component";

export const NewTemplateDialog = props => {
    const { open, onClose, onSaveTemplate } = props;

    return (
        <Dialog open={open} onClose={onClose} fullWidth>
            <NewTemplateContents onSaveTemplate={onSaveTemplate} onClose={onClose} />
        </Dialog>
    );
};
