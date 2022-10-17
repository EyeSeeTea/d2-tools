//
import * as React from "react";
import classNames from "classnames";
import { withStyles } from "@material-ui/core/styles";

const styles = theme => ({
    container: {
        padding: "8px 8px 8px 12px",
    },
    activeContainer: {
        backgroundColor: theme.palette.info.main,
    },
    validatingContainer: {},
    errorContainer: {
        backgroundColor: theme.palette.error.lighter,
    },
    warningContainer: {
        backgroundColor: theme.palette.warning.lighter,
    },
    infoContainer: {},
});

const getFieldContainerBuilder = (InnerComponent, customStyles) =>
    class FieldContainerBuilder extends React.Component {
        render() {
            const { classes, ...passOnProps } = this.props;
            const containerClasses = classNames(classes.container, {
                [classes.activeContainer]: passOnProps.inFocus,
                [classes.validatingContainer]: passOnProps.validatingMessage && !passOnProps.inFocus,
                [classes.errorContainer]:
                    passOnProps.errorMessage && !passOnProps.inFocus && !passOnProps.validatingMessage,
                [classes.warningContainer]:
                    passOnProps.warningMessage &&
                    !passOnProps.inFocus &&
                    !passOnProps.validatingMessage &&
                    !passOnProps.errorMessage,
                [classes.infoContainer]:
                    passOnProps.infoMessage &&
                    !passOnProps.inFocus &&
                    !passOnProps.validatingMessage &&
                    !passOnProps.errorMessage &&
                    !passOnProps.warningMessage,
            });

            return (
                <div className={containerClasses} style={customStyles}>
                    <InnerComponent {...passOnProps} />
                </div>
            );
        }
    };

export const withDefaultFieldContainer = customStyles => InnerComponent =>
    withStyles(styles)(getFieldContainerBuilder(InnerComponent, customStyles));
