//
import * as React from "react";
import { withStyles } from "@material-ui/core/styles";
import i18n from "@dhis2/d2-i18n";
import { ComposedProgramSelector } from "./ComposedProgramSelector.component";

const getStyles = theme => ({
    programLabel: {
        paddingTop: "10px",
        [theme.breakpoints.down(523)]: {
            paddingTop: "0px !important",
        },
    },
});

class ProgramSelectorPlain extends React.Component {
    static baseComponentStyles = {
        labelContainerStyle: {
            flexBasis: 200,
        },
        inputContainerStyle: {
            flexBasis: 150,
        },
    };

    render() {
        const { classes, ...passOnProps } = this.props;
        return (
            // $FlowFixMe[cannot-spread-inexact] automated comment
            <ComposedProgramSelector
                dataTest="relationship-register-tei-program-selector"
                styles={ProgramSelectorPlain.baseComponentStyles}
                programLabelClass={classes.programLabel}
                label={i18n.t("Program")}
                {...passOnProps}
            />
        );
    }
}
export const ProgramSelectorComponent = withStyles(getStyles)(ProgramSelectorPlain);
