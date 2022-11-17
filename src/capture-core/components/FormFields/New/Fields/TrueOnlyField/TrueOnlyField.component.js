//
import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { colors } from "@dhis2/ui";
import { TrueOnlyField as UITrueOnlyField } from "capture-ui";

const getStyles = theme => ({
    iconSelected: {
        fill: theme.palette.secondary.main,
    },
    iconDeselected: {
        fill: colors.grey700,
    },
    iconDisabled: {
        fill: "rgba(0,0,0,0.30)",
    },
    focusSelected: {
        backgroundColor: "rgba(0, 121, 107, 0.4)",
    },
});

class TrueOnlyFieldPlain extends React.Component {
    render() {
        const { onBlur, ...passOnProps } = this.props;
        return (
            // $FlowFixMe[cannot-spread-inexact] automated comment
            <UITrueOnlyField onSelect={onBlur} {...passOnProps} />
        );
    }
}

export const TrueOnlyField = withStyles(getStyles)(TrueOnlyFieldPlain);
