//
import * as React from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router"; //eslint-disable-line
import { ConfirmDialog } from "../components/Dialogs/ConfirmDialog.component";

const getEventListener = (InnerComponent, dialogConfig) =>
    class BrowserBackWarningForDataEntryHOC extends React.Component {
        constructor(props) {
            super(props);
            this.state = {
                dialogOpen: false,
            };
        }

        componentDidMount() {
            const { history } = this.props;
            this.historyLength = window.history.length;
            this.unblock = history.block((nextLocation, method) => {
                const { inEffect } = this.props;
                const isBack = window.history.length === this.historyLength;
                if (method === "POP" && inEffect && isBack) {
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
            this.props.history.goBack();
        };

        handleDialogCancel = () => {
            this.setState({
                dialogOpen: false,
            });
        };

        render() {
            const { inEffect, history, location, match, staticContext, ...passOnProps } = this.props;
            return (
                <React.Fragment>
                    <InnerComponent {...passOnProps} />
                    <ConfirmDialog
                        {...dialogConfig}
                        onConfirm={this.handleDialogConfirm}
                        open={this.state.dialogOpen}
                        onCancel={this.handleDialogCancel}
                    />
                </React.Fragment>
            );
        }
    };

const getMapStateToProps = inEffectFn => (state, props) => {
    const inEffect = inEffectFn(state, props);
    return {
        inEffect,
    };
};

const mapDispatchToProps = () => ({});

export const withBrowserBackWarning = (dialogConfig, inEffect) => InnerComponent =>
    // $FlowFixMe[missing-annot] automated comment
    connect(
        // $FlowFixMe[missing-annot] automated comment
        getMapStateToProps(inEffect),
        mapDispatchToProps
    )(withRouter(getEventListener(InnerComponent, dialogConfig)));
