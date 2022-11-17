//
import React, { useCallback } from "react";
import uuid from "uuid/v4";
import { useDispatch } from "react-redux";
import { batchActions } from "redux-batched-actions";
import { DataEntryComponent } from "./DataEntry.component";
import { startRunRulesPostUpdateField } from "../../DataEntry";
import {
    startAsyncUpdateFieldForNewEvent,
    executeRulesOnUpdateForNewEvent,
    newEventWidgetDataEntryBatchActionTypes,
    setNewEventSaveTypes,
    addNewEventNote,
} from "./actions/dataEntry.actions";

export const DataEntry = ({ orgUnit, rulesExecutionDependenciesClientFormatted, ...passOnProps }) => {
    const dispatch = useDispatch();

    const onUpdateDataEntryField = useCallback(
        innerAction => {
            const { dataEntryId, itemId } = innerAction.payload;
            const uid = uuid();

            dispatch(
                batchActions(
                    [
                        innerAction,
                        startRunRulesPostUpdateField(dataEntryId, itemId, uid),
                        executeRulesOnUpdateForNewEvent({
                            ...innerAction.payload,
                            uid,
                            orgUnit,
                            rulesExecutionDependenciesClientFormatted,
                        }),
                    ],
                    newEventWidgetDataEntryBatchActionTypes.UPDATE_DATA_ENTRY_FIELD_ADD_EVENT_ACTION_BATCH
                )
            );
        },
        [dispatch, orgUnit, rulesExecutionDependenciesClientFormatted]
    );

    const onUpdateField = useCallback(
        innerAction => {
            const { dataEntryId, itemId } = innerAction.payload;
            const uid = uuid();

            dispatch(
                batchActions(
                    [
                        innerAction,
                        startRunRulesPostUpdateField(dataEntryId, itemId, uid),
                        executeRulesOnUpdateForNewEvent({
                            ...innerAction.payload,
                            uid,
                            orgUnit,
                            rulesExecutionDependenciesClientFormatted,
                        }),
                    ],
                    newEventWidgetDataEntryBatchActionTypes.FIELD_UPDATE_BATCH
                )
            );
        },
        [dispatch, orgUnit, rulesExecutionDependenciesClientFormatted]
    );

    const onStartAsyncUpdateField = useCallback(
        (innerAction, dataEntryId, itemId) => {
            const onAsyncUpdateSuccess = successInnerAction => {
                const uid = uuid();
                return batchActions(
                    [
                        successInnerAction,
                        startRunRulesPostUpdateField(dataEntryId, itemId, uid),
                        executeRulesOnUpdateForNewEvent({
                            ...successInnerAction.payload,
                            dataEntryId,
                            itemId,
                            uid,
                            orgUnit,
                            rulesExecutionDependenciesClientFormatted,
                        }),
                    ],
                    newEventWidgetDataEntryBatchActionTypes.FIELD_UPDATE_BATCH
                );
            };
            const onAsyncUpdateError = errorInnerAction => errorInnerAction;

            dispatch(startAsyncUpdateFieldForNewEvent(innerAction, onAsyncUpdateSuccess, onAsyncUpdateError));
        },
        [dispatch, orgUnit, rulesExecutionDependenciesClientFormatted]
    );

    const onAddNote = useCallback(
        (itemId, dataEntryId, note) => {
            dispatch(addNewEventNote(itemId, dataEntryId, note));
        },
        [dispatch]
    );

    const onSetSaveTypes = useCallback(
        newSaveTypes => {
            dispatch(setNewEventSaveTypes(newSaveTypes));
        },
        [dispatch]
    );

    return (
        <DataEntryComponent
            {...passOnProps}
            onUpdateDataEntryField={onUpdateDataEntryField}
            onUpdateField={onUpdateField}
            onStartAsyncUpdateField={onStartAsyncUpdateField}
            onAddNote={onAddNote}
            onSetSaveTypes={onSetSaveTypes}
        />
    );
};
