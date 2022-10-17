//
import * as React from "react";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import i18n from "@dhis2/d2-i18n";
import { Button } from "@dhis2/ui";
import { withStyles } from "@material-ui/core";

class WarningDialogPlain extends React.Component {
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
        const { warnings } = this.props;

        return warnings.map(warningData => (
            <li key={warningData.key}>
                {warningData.name
                    ? WarningDialog.getItemWithName(warningData.name, warningData.warning)
                    : WarningDialog.getItemWithoutName(warningData.warning)}
            </li>
        ));
    }

    render() {
        const { onAbort, onSave, classes } = this.props;
        return (
            <React.Fragment>
                <DialogTitle id="save-dialog-errors-and-warnings-title">
                    {i18n.t("Validation warnings")}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>{this.getContents()}</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <div style={{ margin: "0 20px 12px 20px" }}>
                        <Button onClick={onAbort} color="primary">
                            {i18n.t("Back to form")}
                        </Button>
                        <Button onClick={onSave} primary initialFocus className={classes.marginLeft}>
                            {i18n.t("Save anyway")}
                        </Button>
                    </div>
                </DialogActions>
            </React.Fragment>
        );
    }
}

const styles = () => ({
    marginLeft: {
        marginLeft: 8,
    },
});
export const WarningDialog = withStyles(styles)(WarningDialogPlain);
