//
import * as React from "react";
import { withStyles } from "@material-ui/core/styles";
import { lowerCaseFirstLetter } from "capture-core-utils/string/lowerCaseFirstLetter";
import { D2TextField } from "../../Generic/D2TextField.component";
import { D2DatePopup } from "./D2DatePopup.component";
import { D2DateCalendar } from "./D2DateCalendar.component";

const styles = () => ({
    textField: {
        width: "100%",
    },
});

class D2DatePlain extends React.Component {
    static splitPassOnProps(passOnProps) {
        const splittedProps = {
            input: {},
            popup: {},
            calendar: {},
        };

        if (!passOnProps) {
            return splittedProps;
        }

        return Object.keys(passOnProps).reduce((accSplittedProps, propKey) => {
            let propContainer;
            if (propKey.startsWith(D2Date.propContainers.CALENDAR)) {
                propContainer = D2Date.propContainers.CALENDAR;
            } else if (propKey.startsWith(D2Date.propContainers.POPUP)) {
                propContainer = D2Date.propContainers.POPUP;
            } else {
                propContainer = D2Date.propContainers.INPUT;
            }

            const outputKey = lowerCaseFirstLetter(propKey.replace(propContainer, ""));

            accSplittedProps[propContainer][outputKey] = passOnProps[propKey];
            return accSplittedProps;
        }, splittedProps);
    }

    constructor(props) {
        super(props);

        this.state = {
            popoverOpen: false,
        };

        this.handleTextFieldFocus = this.handleTextFieldFocus.bind(this);
        this.handleDateSelected = this.handleDateSelected.bind(this);
        this.handleTextFieldBlur = this.handleTextFieldBlur.bind(this);
        this.hidePopover = this.hidePopover.bind(this);
        this.handleDocumentClick = this.handleDocumentClick.bind(this);
    }

    componentWillUnmount() {
        // $FlowFixMe[incompatible-call] automated comment
        document.removeEventListener("click", this.handleDocumentClick);
    }

    static propContainers = {
        CALENDAR: "calendar",
        POPUP: "popup",
        INPUT: "input",
    };

    handleTextFieldFocus() {
        // $FlowFixMe[incompatible-call] automated comment
        document.removeEventListener("click", this.handleDocumentClick);

        this.setState({
            popoverOpen: true,
        });

        this.props.onFocus && this.props.onFocus();
    }

    handleDateSelected(value) {
        this.props.onBlur(value);
        this.hidePopover();
        this.props.onDateSelectedFromCalendar && this.props.onDateSelectedFromCalendar();

        // $FlowFixMe[incompatible-call] automated comment
        document.removeEventListener("click", this.handleDocumentClick);
    }

    handleDocumentClick(event) {
        if (
            (event.target &&
                event.target.className &&
                event.target.className.startsWith &&
                event.target.className.startsWith("Cal__")) ||
            (event.target &&
                event.target.className &&
                event.target.className.baseVal &&
                event.target.className.baseVal.startsWith("Cal__"))
        ) {
            return;
        }

        this.hidePopover();

        // $FlowFixMe[incompatible-call] automated comment
        document.removeEventListener("click", this.handleDocumentClick);
    }

    handleTextFieldBlur(value, event) {
        this.props.onBlur(value);

        if (!event.relatedTarget || event.relatedTarget.className !== "Cal__Container__root") {
            this.hidePopover();
        } else {
            // $FlowFixMe[incompatible-call] automated comment
            document.addEventListener("click", this.handleDocumentClick);
        }
    }

    hidePopover() {
        this.setState({
            popoverOpen: false,
        });
    }

    render() {
        const {
            width,
            calendarWidth,
            calendarHeight,
            inputWidth,
            classes,
            onBlur,
            onFocus,
            onDateSelectedFromCalendar,
            textFieldRef,
            ...passOnProps
        } = this.props;
        const { popoverOpen } = this.state;

        const textFieldRefPropObject = textFieldRef ? { ref: textFieldRef } : null;
        const calculatedInputWidth = inputWidth || width;
        const calculatedCalendarWidth = calendarWidth || width;
        const splittedPassOnProps = D2Date.splitPassOnProps(passOnProps);
        const calculatedCalendarHeight = calendarHeight || 350;

        return (
            <div
                ref={containerInstance => {
                    this.containerInstance = containerInstance;
                }}
                style={{
                    width,
                }}
            >
                {/* $FlowFixMe[incompatible-type] automated comment */}
                <D2TextField
                    {...textFieldRefPropObject}
                    onFocus={this.handleTextFieldFocus}
                    onBlur={this.handleTextFieldBlur}
                    className={classes.textField}
                    width={calculatedInputWidth}
                    {...splittedPassOnProps.input}
                />
                <D2DatePopup
                    open={popoverOpen}
                    onClose={this.hidePopover}
                    width={calculatedCalendarWidth}
                    height={calculatedCalendarHeight}
                    inputWidth={calculatedInputWidth}
                    inputUsesFloatingLabel={!!splittedPassOnProps.input.label}
                    {...splittedPassOnProps.popup}
                >
                    <D2DateCalendar
                        onDateSelected={this.handleDateSelected}
                        value={this.props.value}
                        currentWidth={calculatedCalendarWidth}
                        height={calculatedCalendarHeight}
                        {...splittedPassOnProps.calendar}
                    />
                </D2DatePopup>
            </div>
        );
    }
}

export const D2Date = withStyles(styles)(D2DatePlain);
