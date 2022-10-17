//
import * as React from "react";
import { withStyles } from "@material-ui/core/styles";

const styles = theme => ({
    container: {
        marginLeft: theme.spacing.unit,
        marginRight: theme.spacing.unit,
        marginBottom: theme.spacing.unit * 2,
    },
});

const getFieldContainerBuilder = (InnerComponent, customStyles) =>
    class FieldContainerBuilder extends React.Component {
        render() {
            const { classes, ...passOnProps } = this.props;

            return (
                <div className={classes.container} style={customStyles}>
                    <InnerComponent {...passOnProps} />
                </div>
            );
        }
    };

export const withDefaultFieldContainer = customStyles => InnerComponent =>
    withStyles(styles)(getFieldContainerBuilder(InnerComponent, customStyles));
