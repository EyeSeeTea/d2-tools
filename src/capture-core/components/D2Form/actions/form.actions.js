//
import { actionCreator } from "../../../actions/actions.utils";

export const actionTypes = {
    FORM_DATA_ADD: "AddFormData",
    FORM_DATA_REMOVE: "RemoveFormData",
};

export function addFormData(formId, formValues = {}) {
    return actionCreator(actionTypes.FORM_DATA_ADD)({ formValues, formId });
}

export function removeFormData(formId) {
    return actionCreator(actionTypes.FORM_DATA_REMOVE)({ formId });
}
