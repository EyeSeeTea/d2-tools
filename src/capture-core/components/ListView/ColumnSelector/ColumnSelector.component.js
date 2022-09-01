//
import * as React from "react";
import { IconButton, Tooltip } from "@material-ui/core";
import { IconSettings24 } from "@dhis2/ui";
import i18n from "@dhis2/d2-i18n";
import { ColumnSelectorDialog } from "./ColumnSelectorDialog.component";

export class ColumnSelector extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            dialogOpen: false,
        };
    }

    openDialog = () => {
        this.setState({
            dialogOpen: true,
        });
    };

    closeDialog = () => {
        this.setState({
            dialogOpen: false,
        });
    };

    handleSaveColumns = columns => {
        this.props.onSave(columns);
        this.closeDialog();
    };

    render() {
        const { columns } = this.props;
        return (
            <React.Fragment>
                <Tooltip
                    disableFocusListener
                    disableTouchListener
                    enterDelay={500}
                    title={i18n.t("Select columns")}
                >
                    <IconButton onClick={this.openDialog}>
                        <IconSettings24 />
                    </IconButton>
                </Tooltip>
                <ColumnSelectorDialog
                    open={this.state.dialogOpen}
                    onClose={this.closeDialog}
                    onSave={this.handleSaveColumns}
                    columns={columns}
                />
            </React.Fragment>
        );
    }
}
