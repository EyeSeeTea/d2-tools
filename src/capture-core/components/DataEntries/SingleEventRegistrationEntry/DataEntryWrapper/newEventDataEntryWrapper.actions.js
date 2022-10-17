//
import { actionCreator } from "../../../../actions/actions.utils";

export const actionTypes = {
    SET_NEW_EVENT_FORM_LAYOUT_DIRECTION: "SetNewEventFormLayoutDirection",
};

export const setNewEventFormLayoutDirection = formHorizontal =>
    actionCreator(actionTypes.SET_NEW_EVENT_FORM_LAYOUT_DIRECTION)({ formHorizontal });
