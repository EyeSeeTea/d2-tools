//
import * as React from "react";
import { withStyles } from "@material-ui/core/styles";

const getStyles = theme => ({
    evenNumbers: {
        backgroundColor: theme.palette.grey.lightest,
    },
});

export const withAlternateBackgroundColors = () => InnerComponent =>
    withStyles(getStyles)(
        class AlternateBackgroundColorsHOC extends React.Component {
            getContainerProps = (index, total, field) => {
                if (index === 0) {
                    this.hiddenFieldsCount = 0;
                }

                if (field.props && field.props.hidden) {
                    this.hiddenFieldsCount += 1;
                    return {};
                }

                const { classes } = this.props;
                const indexHiddenModified = index - this.hiddenFieldsCount;
                return {
                    className: indexHiddenModified % 2 === 0 ? null : classes.evenNumbers,
                };
            };

            render() {
                const { formHorizontal, classes, ...passOnProps } = this.props;
                const calculatedProps = !formHorizontal
                    ? { onGetContainerProps: this.getContainerProps }
                    : null;

                return (
                    // $FlowFixMe[cannot-spread-inexact] automated comment
                    <InnerComponent {...calculatedProps} {...passOnProps} />
                );
            }
        }
    );
