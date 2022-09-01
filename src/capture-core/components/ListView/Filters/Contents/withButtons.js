//
import * as React from "react";
import { withStyles } from "@material-ui/core/styles";
import i18n from "@dhis2/d2-i18n";
import { Button } from "../../../Buttons";

const getStyles = theme => ({
    buttonsContainer: {
        paddingTop: theme.typography.pxToRem(8),
    },
    firstButtonContainer: {
        paddingRight: theme.typography.pxToRem(8),
        display: "inline-block",
    },
});

export const withButtons = () => InnerComponent =>
    withStyles(getStyles)(
        class FilterContentsButtons extends React.Component {
            update = commitValue => {
                const updateData = this.filterTypeInstance.onGetUpdateData(commitValue);
                this.props.onUpdate(updateData);
            };

            isValid() {
                return this.filterTypeInstance.onIsValid ? this.filterTypeInstance.onIsValid() : true;
            }

            handleUpdateClick = () => {
                if (this.isValid()) {
                    this.update();
                }
            };

            focusUpdateButton = () => {
                this.updateButtonInstance && this.updateButtonInstance.focus();
            };

            focusCloseButton = () => {
                this.closeButtonInstance && this.closeButtonInstance.focus();
            };

            setFilterTypeInstance = filterTypeInstance => {
                this.filterTypeInstance = filterTypeInstance;
            };

            setUpdateButtonInstance = buttonInstance => {
                this.updateButtonInstance = buttonInstance;
            };

            setCloseButtonInstance = buttonInstance => {
                this.closeButtonInstance = buttonInstance;
            };

            render() {
                const { onUpdate, onClose, classes, disabledUpdate, disabledReset, ...passOnProps } =
                    this.props;

                return (
                    <React.Fragment>
                        {/* $FlowFixMe[cannot-spread-inexact] automated comment */}
                        <InnerComponent
                            filterTypeRef={this.setFilterTypeInstance}
                            onUpdate={this.update}
                            onFocusUpdateButton={this.focusUpdateButton}
                            onFocusCloseButton={this.focusCloseButton}
                            {...passOnProps}
                        />
                        <div className={classes.buttonsContainer}>
                            <div className={classes.firstButtonContainer}>
                                <Button
                                    dataTest="list-view-filter-apply-button"
                                    muiButtonRef={this.setUpdateButtonInstance}
                                    primary
                                    onClick={this.handleUpdateClick}
                                    disabled={disabledUpdate}
                                >
                                    {i18n.t("Update")}
                                </Button>
                            </div>
                            <Button
                                dataTest="list-view-filter-cancel-button"
                                muiButtonRef={this.setCloseButtonInstance}
                                secondary
                                onClick={onClose}
                                disabled={disabledReset}
                            >
                                {i18n.t("Reset filter")}
                            </Button>
                        </div>
                    </React.Fragment>
                );
            }
        }
    );
