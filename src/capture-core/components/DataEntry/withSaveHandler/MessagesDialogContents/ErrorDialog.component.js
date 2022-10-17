//
import * as React from "react";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import i18n from "@dhis2/d2-i18n";
import { Button } from "@dhis2/ui";
import { withStyles } from "@material-ui/core";

class ErrorDialogPlain extends React.Component {
    static getItemWithName(name, message) {
        return (
            <React.Fragment>
                {name}: {message}
            </React.Fragment>
        );
    }

    static getItemWithoutName(message) {
        return <React.Fragment>{message}</React.Fragment>;
    }
    getContents() {
        const { errors } = this.props;

        return errors.map(errorData => (
            <li key={errorData.key}>
                {errorData.name
                    ? ErrorDialog.getItemWithName(errorData.name, errorData.error)
                    : ErrorDialog.getItemWithoutName(errorData.error)}
            </li>
        ));
    }

    getButtons() {
        const { onAbort, onSave, saveEnabled, classes } = this.props;

        return (
            <div style={{ margin: "0 20px 12px 20px" }}>
                <Button onClick={onAbort} color="primary">
                    {i18n.t("Back to form")}
                </Button>
                {saveEnabled ? (
                    <Button onClick={onSave} primary initialFocus className={classes.marginLeft}>
                        {i18n.t("Save anyway")}
                    </Button>
                ) : null}
            </div>
        );
    }

    render() {
        return (
            <React.Fragment>
                <DialogTitle id="save-dialog-errors-title">{i18n.t("Validation errors")}</DialogTitle>
                <DialogContent>
                    <DialogContentText>{this.getContents()}</DialogContentText>
                </DialogContent>
                <DialogActions>{this.getButtons()}</DialogActions>
            </React.Fragment>
        );
    }
}

const styles = () => ({
    marginLeft: {
        marginLeft: 8,
    },
});

export const ErrorDialog = withStyles(styles)(ErrorDialogPlain);
