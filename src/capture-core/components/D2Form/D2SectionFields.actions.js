//
import { actionCreator } from "../../actions/actions.utils";

export const actionTypes = {
    UPDATE_FIELD: "UpdateField",
};

export const updateField = (value, uiState, elementId, sectionId, formId) =>
    actionCreator(actionTypes.UPDATE_FIELD)({ value, uiState, formId, sectionId, elementId });
