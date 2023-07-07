//
import React, { Component } from "react";
import i18n from "@dhis2/d2-i18n";
import { D2TextField } from "../../FormFields/Generic/D2TextField.component";
import { withInternalChangeHandler } from "../../FormFields/withInternalChangeHandler";

class MinNumericFilterPlain extends Component {
    static getValueObject(value) {
        return { min: value.trim() };
    }

    handleBlur = value => {
        this.props.onBlur(MinNumericFilterPlain.getValueObject(value));
    };

    handleKeyPress = event => {
        if (event.key === "Enter") {
            this.props.onEnterKey();
        }
    };

    render() {
        const { error, errorClass, onBlur, onEnterKey, ...passOnProps } = this.props;
        return (
            <div>
                {/* $FlowFixMe[cannot-spread-inexact] automated comment */}
                <D2TextField
                    onKeyPress={this.handleKeyPress}
                    onBlur={this.handleBlur}
                    placeholder={i18n.t("Min")}
                    fullWidth
                    {...passOnProps}
                />
                <div className={errorClass}>{error}</div>
            </div>
        );
    }
}

export const MinNumericFilter = withInternalChangeHandler()(MinNumericFilterPlain);
