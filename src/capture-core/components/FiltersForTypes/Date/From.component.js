//
import React, { Component } from "react";
import i18n from "@dhis2/d2-i18n";
import { D2Date } from "../../FormFields/DateAndTime/D2Date/D2Date.component";
import { modes, absoluteDirections } from "../../FormFields/DateAndTime/D2Date/d2DatePopup.const";
import { withInternalChangeHandler } from "../../FormFields/withInternalChangeHandler";

class FromDateFilterPlain extends Component {
    static getValueObject(value) {
        return { from: value.trim() };
    }

    constructor(props) {
        super(props);
        this.displayOptions = {
            showWeekdays: true,
            showHeader: false,
        };
    }

    handleBlur = value => {
        this.props.onBlur(FromDateFilterPlain.getValueObject(value));
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
                <D2Date
                    onKeyPress={this.handleKeyPress}
                    onBlur={this.handleBlur}
                    placeholder={i18n.t("From")}
                    popupMode={modes.ABSOLUTE}
                    popupAbsoluteDirection={absoluteDirections.UP}
                    width={150}
                    calendarWidth={330}
                    calendarHeight={170}
                    calendarRowHeight={45}
                    calendarDisplayOptions={this.displayOptions}
                    {...passOnProps}
                />
                <div className={errorClass}>{error}</div>
            </div>
        );
    }
}

export const FromDateFilter = withInternalChangeHandler()(FromDateFilterPlain);
