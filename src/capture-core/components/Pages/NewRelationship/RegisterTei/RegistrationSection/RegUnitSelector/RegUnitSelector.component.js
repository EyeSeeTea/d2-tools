//
/* eslint-disable react/no-multi-comp */
import * as React from "react";
import i18n from "@dhis2/d2-i18n";
import { withStyles } from "@material-ui/core/styles";
import { ComposedRegUnitSelector } from "./ComposedRegUnitSelector.component";
import { getProgramFromProgramIdThrowIfNotFound } from "../../../../../../metaData";

const getStyles = theme => ({
    label: {
        paddingTop: "10px",
        [theme.breakpoints.down(523)]: {
            paddingTop: "0px !important",
        },
    },
});

class RegUnitSelectorPlain extends React.Component {
    static baseComponentStyles = {
        labelContainerStyle: {
            flexBasis: 200,
        },
        inputContainerStyle: {
            flexBasis: 150,
        },
    };

    handleUpdateSelectedOrgUnit = orgUnit => {
        const { programId, onUpdateSelectedOrgUnit } = this.props;
        if (!programId || !orgUnit) {
            onUpdateSelectedOrgUnit(orgUnit, false);
            return;
        }

        let program;
        try {
            program = getProgramFromProgramIdThrowIfNotFound(programId);
        } catch (error) {
            onUpdateSelectedOrgUnit(orgUnit, true);
            return;
        }

        onUpdateSelectedOrgUnit(
            orgUnit,
            program.organisationUnits ? !program.organisationUnits[orgUnit.id] : false
        );
    };

    render() {
        const { classes, onUpdateSelectedOrgUnit, programId, ...passOnProps } = this.props;
        return (
            // $FlowFixMe[cannot-spread-inexact] automated comment
            <ComposedRegUnitSelector
                labelClass={classes.label}
                label={i18n.t("Organisation Unit")}
                styles={RegUnitSelectorPlain.baseComponentStyles}
                onUpdateSelectedOrgUnit={this.handleUpdateSelectedOrgUnit}
                {...passOnProps}
            />
        );
    }
}
export const RegUnitSelectorComponent = withStyles(getStyles)(RegUnitSelectorPlain);
