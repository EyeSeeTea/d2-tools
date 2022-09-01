//
import { actionCreator, actionPayloadAppender } from "../../../../actions/actions.utils";

export const newEventWidgetDataEntryBatchActionTypes = {
    UPDATE_DATA_ENTRY_FIELD_ADD_EVENT_ACTION_BATCH: "UpdateDataEntryFieldForAddEventActionsBatch",
    FIELD_UPDATE_BATCH: "NewEvent.UpdateFieldBatch",
    OPEN_ADD_EVENT_IN_DATA_ENTRY_ACTIONS_BATCH: "OpenAddEventInDataEntryActionsBatch",
    RULES_EFFECTS_ACTIONS_BATCH: "RulesEffectsForAddEventActionsBatch",
};

export const newEventWidgetDataEntryActionTypes = {
    RULES_ON_UPDATE_EXECUTE: "NewEvent.ExecuteRulesOnUpdate",
    EVENT_NOTE_ADD: "NewEvent.AddEventNote",
    SET_ADD_EVENT_SAVE_TYPES: "SetNewEventSaveTypes", // TODO: https://jira.dhis2.org/browse/DHIS2-11669
};

export const executeRulesOnUpdateForNewEvent = actionData =>
    actionCreator(newEventWidgetDataEntryActionTypes.RULES_ON_UPDATE_EXECUTE)(actionData);

export const setNewEventSaveTypes = newSaveTypes =>
    actionCreator(newEventWidgetDataEntryActionTypes.SET_ADD_EVENT_SAVE_TYPES)({ saveTypes: newSaveTypes });

export const addNewEventNote = (itemId, dataEntryId, note) =>
    actionCreator(newEventWidgetDataEntryActionTypes.EVENT_NOTE_ADD)({ itemId, dataEntryId, note });

export const startAsyncUpdateFieldForNewEvent = (innerAction, onSuccess, onError) =>
    actionPayloadAppender(innerAction)({ onSuccess, onError });
