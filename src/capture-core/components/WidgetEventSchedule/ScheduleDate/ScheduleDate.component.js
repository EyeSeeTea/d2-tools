//
import React from "react";
import { spacersNum } from "@dhis2/ui";
import withStyles from "@material-ui/core/styles/withStyles";
import moment from "moment";
import { DateField } from "capture-core/components/FormFields/New";
import { InfoBox } from "../InfoBox";

const styles = {
    container: {
        display: "flex",
        marginTop: spacersNum.dp4,
    },
    button: {
        paddingRight: spacersNum.dp16,
    },
};

const ScheduleDatePlain = ({
    scheduleDate,
    setScheduleDate,
    orgUnit,
    suggestedScheduleDate,
    eventCountInOrgUnit,
    classes,
}) => (
    <>
        <div className={classes.container}>
            <DateField
                value={moment(scheduleDate).format("YYYY-MM-DD")}
                width="100%"
                calendarWidth={350}
                onSetFocus={() => {}}
                onFocus={() => {}}
                onRemoveFocus={() => {}}
                onBlur={e => {
                    setScheduleDate(e);
                }}
            />
        </div>
        <InfoBox
            scheduleDate={scheduleDate}
            suggestedScheduleDate={suggestedScheduleDate}
            eventCountInOrgUnit={eventCountInOrgUnit}
            orgUnitName={orgUnit?.name}
        />
    </>
);

export const ScheduleDate = withStyles(styles)(ScheduleDatePlain);
