//
/* eslint-disable react/no-array-index-key */
import React, { Component } from "react";
import { Checkbox, spacersNum } from "@dhis2/ui";
import FormControl from "@material-ui/core/FormControl";
import FormLabel from "@material-ui/core/FormLabel";
import FormGroup from "@material-ui/core/FormGroup";
import { withStyles } from "@material-ui/core/styles";
import { multiOrientations } from "./multiSelectBoxes.const";

const styles = theme => ({
    label: theme.typography.formFieldTitle,
    checkbox: {
        marginTop: spacersNum.dp8,
        marginBottom: spacersNum.dp16,
    },
});

class MultiSelectBoxesPlain extends Component {
    constructor(props) {
        super(props);
        this.handleOptionChange = this.handleOptionChange.bind(this);
        this.labelClasses = this.buildLabelClasses();
    }

    buildLabelClasses() {
        return {
            root: this.props.classes.label,
        };
    }

    getBoxes() {
        const { options, classes } = this.props;
        return options.map(({ text, value }, index) => (
            <Checkbox
                key={index}
                checked={this.isChecked(value)}
                label={text}
                name={`multiSelectBoxes-${index}`}
                onChange={e => {
                    this.handleOptionChange(e, value);
                }}
                value={value}
                className={classes.checkbox}
                dense
            />
        ));
    }

    handleOptionChange(e, value) {
        this.handleSelectUpdate(e.checked, value);
    }

    handleSelectUpdate(isChecked, value) {
        let emitValues = null;

        if (isChecked) {
            if (this.checkedValues) {
                this.checkedValues.add(value);

                // $FlowFixMe[incompatible-call] automated comment
                emitValues = Array.from(this.checkedValues);
            } else {
                emitValues = [value];
            }
        } else if (this.checkedValues) {
            this.checkedValues.delete(value);

            // $FlowFixMe[incompatible-use] automated comment
            if (this.checkedValues.size > 0) {
                // $FlowFixMe[incompatible-call] automated comment
                emitValues = Array.from(this.checkedValues);
            } else {
                emitValues = null;
            }
        }

        this.props.onBlur(emitValues);
    }

    setCheckedStatusForBoxes() {
        const value = this.props.value;
        if (value || value === false || value === 0) {
            // $FlowFixMe[prop-missing] automated comment
            this.checkedValues = new Set(value);
        } else {
            this.checkedValues = null;
        }
    }

    isChecked(value) {
        return !!(this.checkedValues && this.checkedValues.has(value));
    }

    renderHorizontal() {
        return <FormGroup row>{this.getBoxes()}</FormGroup>;
    }

    renderVertical() {
        return <FormGroup>{this.getBoxes()}</FormGroup>;
    }

    renderCheckboxes() {
        const orientation = this.props.orientation;
        return orientation === multiOrientations.VERTICAL ? this.renderVertical() : this.renderHorizontal();
    }

    render() {
        const { label, required } = this.props;

        this.setCheckedStatusForBoxes();

        return (
            <div
                ref={containerInstance => {
                    this.materialUIContainerInstance = containerInstance;
                }}
            >
                <FormControl component="fieldset">
                    {(() => {
                        if (!label) {
                            return null;
                        }

                        return (
                            <FormLabel
                                component="label"
                                required={!!required}
                                classes={this.labelClasses}
                                focused={false}
                            >
                                {label}
                            </FormLabel>
                        );
                    })()}
                    {this.renderCheckboxes()}
                </FormControl>
            </div>
        );
    }
}

export const MultiSelectBoxes = withStyles(styles)(MultiSelectBoxesPlain);
