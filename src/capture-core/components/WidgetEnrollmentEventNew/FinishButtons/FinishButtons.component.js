//
import React from "react";
import i18n from "@dhis2/d2-i18n";
import { withStyles } from "@material-ui/core";
import { Button, spacersNum } from "@dhis2/ui";
import { withCancelButton } from "../../DataEntry/withCancelButton";
import { addEventSaveTypes } from "../DataEntry/addEventSaveTypes";

const styles = {
    container: {
        display: "flex",
        marginTop: spacersNum.dp4,
    },
    button: {
        paddingRight: spacersNum.dp16,
    },
};

const FinishButtonsPlain = ({ onSave, cancelButton, classes }) => (
    <div className={classes.container}>
        <div className={classes.button}>
            <Button onClick={() => onSave(addEventSaveTypes.COMPLETE)} primary>
                {i18n.t("Complete")}
            </Button>
        </div>
        <div className={classes.button}>
            <Button onClick={() => onSave(addEventSaveTypes.SAVE_WITHOUT_COMPLETING)}>
                {i18n.t("Save without completing")}
            </Button>
        </div>
        {cancelButton}
    </div>
);

export const FinishButtons = withCancelButton()(withStyles(styles)(FinishButtonsPlain));
