//
import React, { Component } from "react";
import i18n from "@dhis2/d2-i18n";
import { withStyles } from "@material-ui/core/styles";
import { D2TrueOnly } from "../../FormFields/Generic/D2TrueOnly.component";
import { orientations } from "../../FormFields/Options/SelectBoxes"; // TODO: Refactor
import { getTrueOnlyFilterData } from "./trueOnlyFilterDataGetter";

const getStyles = theme => ({
    selectBoxesContainer: {
        marginRight: theme.typography.pxToRem(-24),
    },
});

// $FlowSuppress
// $FlowFixMe[incompatible-variance] automated comment
class TrueOnlyFilterPlain extends Component {
    onGetUpdateData() {
        const value = this.props.value;

        if (!value) {
            return null;
        }

        return getTrueOnlyFilterData();
    }

    onIsValid() {
        //eslint-disable-line
        return true;
    }

    handleTrueOnlyBlur = value => {
        this.props.onCommitValue(value ? [value] : null);
    };

    render() {
        const { value, classes } = this.props;

        return (
            <div className={classes.selectBoxesContainer}>
                <D2TrueOnly
                    label={i18n.t("Yes")}
                    useValueLabel
                    value={value}
                    onBlur={this.handleTrueOnlyBlur}
                    orientation={orientations.VERTICAL}
                />
            </div>
        );
    }
}

export const TrueOnlyFilter = withStyles(getStyles)(TrueOnlyFilterPlain);
