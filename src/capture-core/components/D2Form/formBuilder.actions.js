//
import { actionCreator } from "../../actions/actions.utils";

export const actionTypes = {
    UPDATE_FIELD_UI_ONLY: "UpdateFieldUIOnly",
};

export const updateFieldUIOnly = (uiState, elementId, sectionId) =>
    actionCreator(actionTypes.UPDATE_FIELD_UI_ONLY)({ uiState, elementId, sectionId });
