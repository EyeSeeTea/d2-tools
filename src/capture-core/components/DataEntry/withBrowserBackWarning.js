//
import * as React from "react";
import i18n from "@dhis2/d2-i18n";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";

import { ConfirmDialog } from "../Dialogs/ConfirmDialog.component";
import { getDataEntryKey } from "./common/getDataEntryKey";
import { dataEntryHasChanges as getDataEntryHasChanges } from "./common/dataEntryHasChanges";

const getEventListener = InnerComponent =>
    class BrowserBackWarningForDataEntryHOC extends React.Component {
        constructor(props) {
            super(props);
            this.state = {
                dialogOpen: false,
            };
        }

        componentDidMount() {
            const { history } = this.props;
            this.unblock = history.block((nextLocation, method) => {
                const { dataEntryHasChanges } = this.props;
                if (method === "POP" && dataEntryHasChanges) {
                    this.setState({
                        dialogOpen: true,
                    });
                    return false;
                }
                return true;
            });
        }

        componentWillUnmount() {
            this.unblock && this.unblock();
        }

        handleDialogConfirm = () => {
            this.setState({
                dialogOpen: false,
            });
            this.unblock();
            // this.props.history.goBack();
        };

        handleDialogCancel = () => {
            this.setState({
                dialogOpen: false,
            });
        };

        render() {
            // $FlowFixMe[prop-missing] automated comment
            const { dataEntryHasChanges, history, location, match, staticContext, ...passOnProps } =
                this.props;
            return (
                <React.Fragment>
                    <InnerComponent {...passOnProps} />
                    <ConfirmDialog
                        header={i18n.t("Unsaved changes")}
                        text={i18n.t("Leaving this page will discard the changes you made to this event.")}
                        confirmText={i18n.t("Yes, discard")}
                        cancelText={i18n.t("No, stay here")}
                        onConfirm={this.handleDialogConfirm}
                        open={this.state.dialogOpen}
                        onCancel={this.handleDialogCancel}
                    />
                </React.Fragment>
            );
        }
    };

const mapStateToProps = (state, props) => {
    const itemId = state.dataEntries && state.dataEntries[props.id] && state.dataEntries[props.id].itemId;
    const key = getDataEntryKey(props.id, itemId);
    const dataEntryHasChanges = getDataEntryHasChanges(state, key);
    return {
        dataEntryHasChanges,
    };
};

const mapDispatchToProps = () => ({});

export const withBrowserBackWarning = () => InnerComponent =>
    // $FlowFixMe[missing-annot] automated comment
    connect(
        // $FlowFixMe[missing-annot] automated comment
        mapStateToProps,
        mapDispatchToProps
    )(withRouter(getEventListener(InnerComponent)));
