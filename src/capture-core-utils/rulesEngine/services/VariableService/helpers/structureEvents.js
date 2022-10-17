//
import { eventStatuses } from "../constants";

const createEventsContainer = events => {
    const eventsDataByStage = events.reduce((accEventsByStage, event) => {
        accEventsByStage[event.programStageId] = accEventsByStage[event.programStageId] || [];
        accEventsByStage[event.programStageId].push(event);
        return accEventsByStage;
    }, {});

    return { all: events, byStage: eventsDataByStage };
};

export const getStructureEvents = compareDates => {
    const compareEvents = (first, second) => {
        let result;
        if (!first.eventDate && !second.eventDate) {
            result = 0;
        } else if (!first.eventDate) {
            result = 1;
        } else if (!second.eventDate) {
            result = -1;
        } else {
            result = compareDates(first.eventDate, second.eventDate);
        }
        return result;
    };

    return (currentEvent = {}, otherEvents = []) => {
        const otherEventsFiltered = otherEvents.filter(
            event =>
                event.eventDate &&
                [eventStatuses.COMPLETED, eventStatuses.ACTIVE, eventStatuses.VISITED].includes(
                    event.status
                ) &&
                event.eventId !== currentEvent.eventId
        );

        const events = [...otherEventsFiltered, currentEvent].sort(compareEvents);

        return createEventsContainer(events);
    };
};
