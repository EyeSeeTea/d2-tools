//
import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import { D2TrueFalse } from "../../FormFields/Generic/D2TrueFalse.component";
import { orientations } from "../../FormFields/Options/SelectBoxes"; // TODO: Refactor
import { getBooleanFilterData } from "./booleanFilterDataGetter";

const getStyles = theme => ({
    selectBoxesContainer: {
        marginRight: theme.typography.pxToRem(-24),
    },
});

// $FlowSuppress
// $FlowFixMe[incompatible-variance] automated comment
class BooleanFilterPlain extends Component {
    onGetUpdateData() {
        const value = this.props.value;

        if (!value) {
            return null;
        }

        return getBooleanFilterData(value);
    }

    onIsValid() {
        //eslint-disable-line
        return true;
    }

    setBooleanFieldInstance = instance => {
        this.booleanFieldInstance = instance;
    };

    render() {
        const { onCommitValue, value, classes } = this.props;

        return (
            <div className={classes.selectBoxesContainer}>
                <D2TrueFalse
                    ref={this.setBooleanFieldInstance}
                    allowMultiple
                    value={value}
                    onBlur={onCommitValue}
                    orientation={orientations.VERTICAL}
                />
            </div>
        );
    }
}

export const BooleanFilter = withStyles(getStyles)(BooleanFilterPlain);
