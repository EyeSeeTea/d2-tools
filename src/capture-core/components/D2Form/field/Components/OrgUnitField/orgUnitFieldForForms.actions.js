//
import { actionCreator } from "../../../../../actions/actions.utils";

export const actionTypes = {
    REQUEST_FILTER_FORM_FIELD_ORG_UNITS: "RequestFilterFormFieldOrgUnits",
    FILTERED_FORM_FIELD_ORG_UNITS_RETRIEVED: "FilteredFormFieldOrgUnitsRetrieved",
    FILTER_FORM_FIELD_ORG_UNITS_FAILED: "FilterFormFieldOrgUnitsFailed",
    RESET_FORM_FIELD_ORG_UNITS_FILTER: "ResetFormFieldOrgUnitsFilter",
};

export const requestFilterFormFieldOrgUnits = (formId, elementId, searchText) =>
    actionCreator(actionTypes.REQUEST_FILTER_FORM_FIELD_ORG_UNITS)({ formId, elementId, searchText });

export const filteredFormFieldOrgUnitsRetrieved = (formId, elementId, roots) =>
    actionCreator(actionTypes.FILTERED_FORM_FIELD_ORG_UNITS_RETRIEVED)({ formId, elementId, roots });

export const filterFormFieldOrgUnitsFailed = (formId, elementId, errorMessage) =>
    actionCreator(actionTypes.FILTER_FORM_FIELD_ORG_UNITS_FAILED)({ formId, elementId, errorMessage });

export const resetFormFieldOrgUnitsFilter = (formId, elementId) =>
    actionCreator(actionTypes.RESET_FORM_FIELD_ORG_UNITS_FILTER)({ formId, elementId });
