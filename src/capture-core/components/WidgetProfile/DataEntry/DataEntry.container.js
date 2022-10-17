//
import React, { useState, useCallback } from "react";
import { useDispatch } from "react-redux";

import { DataEntryComponent } from "./DataEntry.component";
import { useLifecycle, useFormValidations } from "./hooks";
import { getUpdateFieldActions, updateTeiRequest, setTeiModalError } from "./dataEntry.actions";

export const DataEntry = ({
    programAPI,
    orgUnitId,
    onCancel,
    onDisable,
    clientAttributesWithSubvalues,
    userRoles,
    modalState,
    trackedEntityInstanceId,
    onSaveSuccessActionType,
    onSaveErrorActionType,
    onSaveExternal,
}) => {
    const dataEntryId = "trackedEntityProfile";
    const itemId = "edit";
    const dispatch = useDispatch();
    const [saveAttempted, setSaveAttempted] = useState(false);

    const dataEntryContext = useLifecycle({
        programAPI,
        orgUnitId,
        clientAttributesWithSubvalues,
        userRoles,
        dataEntryId,
        itemId,
    });
    const { trackedEntityName, ...context } = dataEntryContext;
    const { formFoundation } = context;
    const { formValidated, errorsMessages, warningsMessages } = useFormValidations(
        dataEntryId,
        itemId,
        saveAttempted
    );

    const onUpdateFormField = useCallback(
        (...args) => dispatch(getUpdateFieldActions(context, ...args)),
        [dispatch, context]
    );
    const onUpdateFormFieldAsync = useCallback(
        innerAction => {
            dispatch(innerAction);
        },
        [dispatch]
    );
    const getValidationContext = useCallback(
        () => ({
            programId: programAPI.id,
            orgUnitId,
            trackedEntityInstanceId,
        }),
        [programAPI, orgUnitId, trackedEntityInstanceId]
    );

    const onSave = useCallback(() => {
        setSaveAttempted(true);
        if (formValidated) {
            onDisable();
            dispatch(setTeiModalError(false));
            dispatch(
                updateTeiRequest({
                    itemId,
                    dataEntryId,
                    orgUnitId,
                    trackedEntityInstanceId,
                    trackedEntityTypeId: programAPI.trackedEntityType.id,
                    onSaveExternal,
                    onSaveSuccessActionType,
                    onSaveErrorActionType,
                    formFoundation,
                })
            );
        }
    }, [
        dispatch,
        itemId,
        dataEntryId,
        orgUnitId,
        trackedEntityInstanceId,
        programAPI,
        formValidated,
        formFoundation,
        onSaveExternal,
        onSaveSuccessActionType,
        onSaveErrorActionType,
        onDisable,
    ]);

    return (
        Object.entries(formFoundation).length > 0 && (
            <DataEntryComponent
                dataEntryId={dataEntryId}
                itemId={itemId}
                onCancel={onCancel}
                onSave={onSave}
                saveAttempted={saveAttempted}
                trackedEntityName={trackedEntityName}
                formFoundation={formFoundation}
                onUpdateFormField={onUpdateFormField}
                onUpdateFormFieldAsync={onUpdateFormFieldAsync}
                modalState={modalState}
                onGetValidationContext={getValidationContext}
                errorsMessages={errorsMessages}
                warningsMessages={warningsMessages}
            />
        )
    );
};
