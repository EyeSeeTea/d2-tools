//
import { actionCreator } from "../../../actions/actions.utils";
import { effectMethods } from "../../../trackerOffline";

export const newEventWidgetActionTypes = {
    RULES_ON_UPDATE_EXECUTE: "NewEvent.ExecuteRulesOnUpdate",
    EVENT_SAVE_REQUEST: "NewEvent.RequestSaveEvent",
    EVENT_SAVE: "NewEvent.SaveEvent",
    EVENT_SAVE_SUCCESS: "NewEvent.SaveEventSuccess", // TEMPORARY - pass in success action name to the widget
    EVENT_SAVE_ERROR: "NewEvent.SaveEventError", // TEMPORARY - pass in error action name to the widget
    EVENT_NOTE_ADD: "NewEvent.AddEventNote",
};

export const requestSaveEvent = ({
    eventId,
    dataEntryId,
    formFoundation,
    programId,
    orgUnitId,
    orgUnitName,
    teiId,
    enrollmentId,
    completed,
    onSaveExternal,
    onSaveSuccessActionType,
    onSaveErrorActionType,
}) =>
    actionCreator(newEventWidgetActionTypes.EVENT_SAVE_REQUEST)(
        {
            eventId,
            dataEntryId,
            formFoundation,
            programId,
            orgUnitId,
            orgUnitName,
            teiId,
            enrollmentId,
            completed,
            onSaveExternal,
            onSaveSuccessActionType,
            onSaveErrorActionType,
        },
        { skipLogging: ["formFoundation"] }
    );

export const saveEvent = (serverData, onSaveSuccessActionType, onSaveErrorActionType, uid) =>
    actionCreator(newEventWidgetActionTypes.EVENT_SAVE)(
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
