//
import React, { Component } from "react";
import { Input } from "./Input.component";
import { getTextFilterData } from "./textFilterDataGetter";

// $FlowSuppress
// $FlowFixMe[incompatible-variance] automated comment
export class TextFilter extends Component {
    onGetUpdateData(updatedValue) {
        const value = typeof updatedValue !== "undefined" ? updatedValue : this.props.value;

        if (!value) {
            return null;
        }

        return getTextFilterData(value);
    }

    handleEnterKey = value => {
        this.props.onUpdate(value || null);
    };

    handleBlur = value => {
        this.props.onCommitValue(value);
    };

    handleChange = value => {
        this.props.onCommitValue(value);
    };

    render() {
        const { value } = this.props;
        return (
            /* $FlowSuppress: Flow not working 100% with HOCs */
            // $FlowFixMe[prop-missing] automated comment
            <Input
                onChange={this.handleChange}
                onBlur={this.handleBlur}
                onEnterKey={this.handleEnterKey}
                value={value}
            />
        );
    }
}
