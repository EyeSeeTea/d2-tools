//
import React from "react";
import moment from "moment";
import { statusTypes, translatedStatusTypes } from "capture-core/events/statusTypes";
import { convertMomentToDateFormatString } from "../../../../../../utils/converters/date";
import { getSubValues } from "../../getEventDataWithSubValue";

import { Comments } from "../Comments.component";

const isEventOverdue = event =>
    moment(event.scheduledAt).isBefore(moment().startOf("day")) && event.status === statusTypes.SCHEDULE;

const getEventStatus = event => {
    const today = moment().startOf("day");
    const dueDate = moment(event.scheduledAt);
    const dueDateFromNow = dueDate.from(today);
    const daysUntilDueDate = dueDate.diff(today, "days");

    if (isEventOverdue(event)) {
        return { status: statusTypes.OVERDUE, options: daysUntilDueDate ? dueDateFromNow : undefined };
    }
    // DHIS2-11576: VISITED status is treated as ACTIVE
    if (event.status === "VISITED") {
        return { status: statusTypes.ACTIVE, options: undefined };
    }

    if (event.status === statusTypes.SCHEDULE) {
        if (!event.scheduledAt || !daysUntilDueDate) {
            return { status: statusTypes.SCHEDULE, options: undefined };
        }

        if (daysUntilDueDate < 14) {
            return { status: statusTypes.SCHEDULE, options: dueDateFromNow };
        }
        return { status: statusTypes.SCHEDULE, options: convertMomentToDateFormatString(dueDate) };
    }
    return { status: event.status, options: undefined };
};

const getValueByKeyFromEvent = (event, { id, resolveValue }) => {
    if (resolveValue) {
        return resolveValue(event);
    }

    return event[id];
};

const convertStatusForView = event => {
    const { status, options } = getEventStatus(event);
    const isPositive = [statusTypes.COMPLETED].includes(status);
    const isNegative = [statusTypes.OVERDUE].includes(status);
    return {
        isNegative,
        isPositive,
        text: translatedStatusTypes(options)[status],
        status,
    };
};

const convertCommentForView = event => <Comments event={event} />;

const groupRecordsByType = async (events, dataElements) => {
    // $FlowFixMe
    const dataElementsByType = events.reduce((acc, event) => {
        event.dataValues.forEach(dataValue => {
            const { dataElement: id, value } = dataValue;
            const { type } = dataElements.find(el => el.id === id) || {};
            if (!type) {
                return;
            }
            const currentItem = acc.find(item => item.type === type && item.eventId === event.event);
            if (!currentItem) {
                acc.push({ type, eventId: event.event, ids: { [id]: value } });
            } else {
                currentItem.ids[id] = value;
            }
        });
        return acc;
    }, []);
    // $FlowFixMe
    for await (const item of dataElementsByType) {
        item.ids = await getSubValues(item.type, item.ids);
    }
    return dataElementsByType;
};

export {
    isEventOverdue,
    getEventStatus,
    convertStatusForView,
    convertCommentForView,
    getValueByKeyFromEvent,
    groupRecordsByType,
};
