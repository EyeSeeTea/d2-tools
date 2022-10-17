//
import * as React from "react";
import { withStyles } from "@material-ui/core/styles";

const getBorder = theme => {
    const color = theme.palette.dividerLighter;
    return `${theme.typography.pxToRem(1)} solid ${color}`;
};

const getStyles = theme => ({
    container: {
        border: getBorder(theme),
    },
});

export const withBorder = () => InnerComponent =>
    withStyles(getStyles)(
        class BorderHOC extends React.Component {
            render() {
                const { classes, ...passOnProps } = this.props;
                return (
                    <div className={classes.container} data-test="workinglists-border">
                        <InnerComponent {...passOnProps} />
                    </div>
                );
            }
        }
    );
