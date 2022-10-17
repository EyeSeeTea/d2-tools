//
import React, { Component } from "react";
import i18n from "@dhis2/d2-i18n";
import { D2TextField } from "../../FormFields/Generic/D2TextField.component";
import { withInternalChangeHandler } from "../../FormFields/withInternalChangeHandler";

class EndRangeFilterPlain extends Component {
    static getValueObject(value) {
        return { end: value.trim() };
    }

    handleBlur = value => {
        this.props.onBlur(EndRangeFilterPlain.getValueObject(value));
    };

    handleKeyPress = event => {
        if (event.key === "Enter") {
            this.props.onEnterKey(EndRangeFilterPlain.getValueObject(this.props.value || ""));
        }
    };

    render() {
        const { error, onBlur, onEnterKey, textFieldRef, errorClass, ...passOnProps } = this.props;
        return (
            <div>
                {/* $FlowFixMe[cannot-spread-inexact] automated comment */}
                <D2TextField
                    ref={textFieldRef}
                    onKeyPress={this.handleKeyPress}
                    onBlur={this.handleBlur}
                    placeholder={i18n.t("Days in the future")}
                    fullWidth
                    data-test="date-range-filter-end"
                    {...passOnProps}
                />
                <div className={errorClass}>{error}</div>
            </div>
        );
    }
}

export const EndRangeFilter = withInternalChangeHandler()(EndRangeFilterPlain);
