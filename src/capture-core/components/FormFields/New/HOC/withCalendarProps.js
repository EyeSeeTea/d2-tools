//
import * as React from "react";
import { capitalizeFirstLetter } from "capture-core-utils/string";
import { parseDate, convertDateObjectToDateFormatString } from "../../../../utils/converters/date";
import { getCalendarTheme } from "../Fields/DateAndTimeFields/getCalendarTheme";
import { CurrentLocaleData } from "../../../../utils/localeData/CurrentLocaleData";

export const withCalendarProps = () => InnerComponent =>
    class CalendarPropsHOC extends React.Component {
        static convertValueIntoCalendar(inputValue) {
            if (!inputValue) {
                return new Date();
            }

            const parseData = parseDate(inputValue);
            if (!parseData.isValid) {
                return new Date();
            }

            // $FlowFixMe[incompatible-use] automated comment
            return parseData.momentDate.toDate();
        }

        static convertValueOutFromCalendar(changeDate) {
            return convertDateObjectToDateFormatString(changeDate);
        }

        constructor(props) {
            super(props);
            this.calendarTheme = getCalendarTheme(this.props.theme);
            const projectLocaleData = CurrentLocaleData.get();
            const calculatedCalendarWidth = this.props.calendarWidth || this.props.width;
            this.calendarLocaleData = {
                locale: projectLocaleData.dateFnsLocale,
                headerFormat:
                    calculatedCalendarWidth >= 400
                        ? projectLocaleData.calendarFormatHeaderLong
                        : projectLocaleData.calendarFormatHeaderShort,
                weekdays: projectLocaleData.weekDaysShort.map(day => capitalizeFirstLetter(day)),
                blank: projectLocaleData.selectDatesText,
                todayLabel: {
                    long: projectLocaleData.todayLabelLong,
                    short: projectLocaleData.todayLabelShort,
                },
                weekStartsOn: projectLocaleData.weekStartsOn,
            };
        }

        render() {
            const { theme, ...passOnProps } = this.props;
            return (
                // $FlowFixMe
                <InnerComponent
                    calendarTheme={this.calendarTheme}
                    calendarLocale={this.calendarLocaleData}
                    calendarOnConvertValueIn={CalendarPropsHOC.convertValueIntoCalendar}
                    calendarOnConvertValueOut={CalendarPropsHOC.convertValueOutFromCalendar}
                    {...passOnProps}
                />
            );
        }
    };
