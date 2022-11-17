//
import { actionCreator } from "../../actions/actions.utils";
import { effectMethods } from "../../trackerOffline";

export const scheduleEventWidgetActionTypes = {
    EVENT_SCHEDULE_REQUEST: "ScheduleEvent.RequestScheduleEvent",
    EVENT_SCHEDULE: "ScheduleEvent.ScheduleEvent",
};

export const requestScheduleEvent = ({
    scheduleDate,
    comments,
    programId,
    orgUnitId,
    stageId,
    teiId,
    enrollmentId,
    onSaveExternal,
    onSaveSuccessActionType,
    onSaveErrorActionType,
}) =>
    actionCreator(scheduleEventWidgetActionTypes.EVENT_SCHEDULE_REQUEST)({
        scheduleDate,
        comments,
        programId,
        orgUnitId,
        stageId,
        teiId,
        enrollmentId,
        onSaveExternal,
        onSaveSuccessActionType,
        onSaveErrorActionType,
    });

export const scheduleEvent = (serverData, uid, onSaveSuccessActionType, onSaveErrorActionType) =>
    actionCreator(scheduleEventWidgetActionTypes.EVENT_SCHEDULE)(
        {},
        {
            offline: {
                effect: {
                    url: "tracker?async=false",
                    method: effectMethods.POST,
                    data: serverData,
                },
                commit: onSaveSuccessActionType && {
                    type: onSaveSuccessActionType,
                    meta: { serverData, uid },
                },
                rollback: onSaveErrorActionType && { type: onSaveErrorActionType, meta: { serverData, uid } },
            },
        }
    );
