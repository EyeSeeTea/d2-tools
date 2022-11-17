//
import i18n from "@dhis2/d2-i18n";
import { actionCreator } from "../../../actions/actions.utils";

export const actionTypes = {
    FIELDS_VALIDATED: "FieldsValidated",
    FIELD_IS_VALIDATING: "FieldIsValidating",
    START_UPDATE_FIELD_ASYNC: "StartUpdateFieldAsync",
    UPDATE_FIELD_FROM_ASYNC: "UpdateFieldFromAsync",
    ASYNC_UPDATE_FIELD_FAILED: "AsyncUpdateFieldFailed",
};

export const fieldIsValidating = (fieldId, formBuilderId, formId, message, fieldUIUpdates, validatingUid) =>
    actionCreator(actionTypes.FIELD_IS_VALIDATING)({
        fieldId,
        formBuilderId,
        formId,
        message: message || i18n.t("This value is validating"),
        fieldUIUpdates,
        validatingUid,
    });

export const fieldsValidated = (fieldsUI, formBuilderId, formId, validatingUids) =>
    actionCreator(actionTypes.FIELDS_VALIDATED)({ fieldsUI, formBuilderId, formId, validatingUids });

export const startUpdateFieldAsync = (elementId, fieldLabel, formBuilderId, formId, uid, callback) =>
    actionCreator(actionTypes.START_UPDATE_FIELD_ASYNC)({
        elementId,
        fieldLabel,
        formBuilderId,
        formId,
        uid,
        callback,
    });

export const updateFieldFromAsync = (value, uiState, elementId, formBuilderId, formId, uid) =>
    actionCreator(actionTypes.UPDATE_FIELD_FROM_ASYNC)({
        value,
        uiState,
        elementId,
        formBuilderId,
        formId,
        uid,
    });

export const asyncUpdateFieldFailed = (message, uiState, elementId, formBuilderId, formId, uid) =>
    actionCreator(actionTypes.ASYNC_UPDATE_FIELD_FAILED)({
        message,
        uiState,
        elementId,
        formBuilderId,
        formId,
        uid,
    });
