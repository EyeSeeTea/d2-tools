//
import * as React from "react";
import { Dialog } from "@material-ui/core";
import { ExistingTemplateContents } from "./ExistingTemplateContents.component";

export const ExistingTemplateDialog = props => {
    const { open, onClose, onSaveTemplate } = props;

    return (
        <Dialog open={open} onClose={onClose} fullWidth>
            <ExistingTemplateContents onSaveTemplate={onSaveTemplate} onClose={onClose} />
        </Dialog>
    );
};
