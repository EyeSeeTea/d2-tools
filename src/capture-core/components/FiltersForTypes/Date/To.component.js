//
import React, { Component } from "react";
import i18n from "@dhis2/d2-i18n";
import { D2Date } from "../../FormFields/DateAndTime/D2Date/D2Date.component";
import {
    anchorPositions,
    modes,
    absoluteDirections,
} from "../../FormFields/DateAndTime/D2Date/d2DatePopup.const";
import { withInternalChangeHandler } from "../../FormFields/withInternalChangeHandler";

class ToDateFilterPlain extends Component {
    static getValueObject(value) {
        return { to: value.trim() };
    }

    constructor(props) {
        super(props);
        this.displayOptions = {
            showWeekdays: true,
            showHeader: false,
        };
    }

    handleBlur = value => {
        this.props.onBlur(ToDateFilterPlain.getValueObject(value));
    };

    handleKeyPress = event => {
        if (event.key === "Enter") {
            this.props.onEnterKey(ToDateFilterPlain.getValueObject(this.props.value || ""));
        }
    };

    handleDateSelectedFromCalendar = () => {
        this.props.onFocusUpdateButton();
    };

    render() {
        const { error, onBlur, onEnterKey, errorClass, onFocusUpdateButton, ...passOnProps } = this.props;
        return (
            <div>
                {/* $FlowFixMe[cannot-spread-inexact] automated comment */}
                <D2Date
                    onKeyPress={this.handleKeyPress}
                    onBlur={this.handleBlur}
                    onDateSelectedFromCalendar={this.handleDateSelectedFromCalendar}
                    placeholder={i18n.t("To")}
                    popupAnchorPosition={anchorPositions.RIGHT}
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

export const ToDateFilter = withInternalChangeHandler()(ToDateFilterPlain);
