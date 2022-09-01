//
import { actionCreator } from "../../../actions/actions.utils";

export const batchActionTypes = {
    ASYNC_UPDATE_FIELD_FAILED_BATCH: "AsyncUpdateFieldFailedBatch",
};

export const actionTypes = {
    START_COMPLETE_EVENT: "StartCompleteDataEntryEvent",
    COMPLETE_EVENT: "CompleteDataEntryEvent",
    COMPLETE_EVENT_ERROR: "CompleteDataEntryEventError",
    COMPLETE_VALIDATION_FAILED: "CompleteValidationFailedForDataEntry",
    COMPLETE_ABORT: "CompleteAbortedForDataEntry",
    START_SAVE_EVENT: "StartSaveDataEntryEvent",
    SAVE_EVENT: "SaveDataEntryEvent",
    SAVE_EVENT_ERROR: "SaveDataEntryEventError",
    SAVE_VALIDATION_FALED: "SaveValidationFailedForDataEntry",
    SAVE_ABORT: "SaveAbortedForDataEntry",
    UPDATE_FIELD: "UpdateDataEntryField",
    UPDATE_FORM_FIELD: "UpdateDataEntryFormField",
    RULES_EXECUTED_POST_UPDATE_FIELD: "RulesExecutedPostUpdateFieldDataEntry",
    ADD_DATA_ENTRY_NOTE: "AddDataEntryNote",
    REMOVE_DATA_ENTRY_NOTE: "RemoveDataEntryNote",
    SET_CURRENT_DATA_ENTRY: "SetCurrentDataEntry",
    START_RUN_RULES_POST_UPDATE_FIELD: "StartRunRulesPostUpdateFieldDataEntry",
    REMOVE_DATA_ENTRY_RELATIONSHIP: "RemoveDataEntryRelationship",
    ADD_DATA_ENTRY_RELATIONSHIP: "AddDataEntryRelationship",
    DATA_ENTRY_RELATIONSHIP_ALREADY_EXISTS: "DataEntryRelationshipAlreadyExists",
    LOAD_EDIT_DATA_ENTRY: "LoadEditDataEntry",
    CLEAN_UP_DATA_ENTRY: "CleanUpDataEntry",
};

// COMPLETE
export const startCompleteEvent = (eventId, id) =>
    actionCreator(actionTypes.START_COMPLETE_EVENT)({ eventId, id });

export const completeEventError = (error, id) =>
    actionCreator(actionTypes.COMPLETE_EVENT_ERROR)({ error, id });

export const completeEvent = (clientValues, serverData, event, eventId, id) =>
    actionCreator(actionTypes.COMPLETE_EVENT)(
        {
            clientValues,
            eventId,
            event: { ...event, status: "COMPLETED" },
            requestInfo: {
                data: serverData,
                endpoint: `events/${eventId}`,
                method: "POST",
            },
            id,
        },
        {
            isOptimistic: true,
        }
    );

export const completeValidationFailed = (eventId, id) =>
    actionCreator(actionTypes.COMPLETE_VALIDATION_FAILED)({ eventId, id });

export const completeAbort = (eventId, id) => actionCreator(actionTypes.COMPLETE_ABORT)({ eventId, id });

// SAVE
export const startSaveEvent = (eventId, id) => actionCreator(actionTypes.START_SAVE_EVENT)({ eventId, id });

export const saveEventError = (error, id) => actionCreator(actionTypes.SAVE_EVENT_ERROR)({ error, id });

export const saveEvent = (clientValues, serverData, event, eventId, id) =>
    actionCreator(actionTypes.SAVE_EVENT)(
        {
            clientValues,
            eventId,
            event,
            requestInfo: {
                data: serverData,
                endpoint: `events/${eventId}`,
                method: "POST",
            },
            id,
        },
        {
            isOptimistic: true,
        }
    );

export const saveValidationFailed = (itemId, id) =>
    actionCreator(actionTypes.SAVE_VALIDATION_FALED)({ itemId, id });

export const saveAbort = (itemId, id) => actionCreator(actionTypes.SAVE_ABORT)({ itemId, id });

export const updateField = (value, valueMeta, fieldId, dataEntryId, itemId) =>
    actionCreator(actionTypes.UPDATE_FIELD)({ value, valueMeta, fieldId, dataEntryId, itemId });

export const updateFormField = (
    value,
    uiState,
    elementId,
    formBuilderId,
    formId,
    dataEntryId,
    itemId,
    updateCompleteUid
) =>
    actionCreator(actionTypes.UPDATE_FORM_FIELD)({
        value,
        uiState,
        formId,
        formBuilderId,
        elementId,
        dataEntryId,
        itemId,
        updateCompleteUid,
    });

export const startRunRulesPostUpdateField = (dataEntryId, itemId, uid) =>
    actionCreator(actionTypes.START_RUN_RULES_POST_UPDATE_FIELD)({ dataEntryId, itemId, uid });

export const rulesExecutedPostUpdateField = (dataEntryId, itemId, uid) =>
    actionCreator(actionTypes.RULES_EXECUTED_POST_UPDATE_FIELD)({ dataEntryId, itemId, uid });

export const addNote = (dataEntryId, itemId, note) =>
    actionCreator(actionTypes.ADD_DATA_ENTRY_NOTE)({ dataEntryId, itemId, note });

export const removeNote = (dataEntryId, itemId, noteClientId) =>
    actionCreator(actionTypes.REMOVE_DATA_ENTRY_NOTE)({ dataEntryId, itemId, noteClientId });

export const setCurrentDataEntry = (dataEntryId, itemId, extraProps) =>
    actionCreator(actionTypes.SET_CURRENT_DATA_ENTRY)({ dataEntryId, itemId, extraProps });

export const removeRelationship = (dataEntryId, itemId, relationshipClientId) =>
    actionCreator(actionTypes.REMOVE_DATA_ENTRY_RELATIONSHIP)({ dataEntryId, itemId, relationshipClientId });

export const addRelationship = (dataEntryId, itemId, relationship, newToEntity) =>
    actionCreator(actionTypes.ADD_DATA_ENTRY_RELATIONSHIP)({
        dataEntryId,
        itemId,
        relationship,
        newToEntity,
    });

export const relationshipAlreadyExists = (dataEntryId, itemId, message) =>
    actionCreator(actionTypes.DATA_ENTRY_RELATIONSHIP_ALREADY_EXISTS)({ dataEntryId, itemId, message });

export const loadEditDataEntry = args => actionCreator(actionTypes.LOAD_EDIT_DATA_ENTRY)(args);

export const cleanUpDataEntry = dataEntryId =>
    actionCreator(actionTypes.CLEAN_UP_DATA_ENTRY)({ dataEntryId });
