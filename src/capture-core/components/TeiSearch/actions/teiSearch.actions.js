//

import { actionCreator } from "../../../actions/actions.utils";

export const batchActionTypes = {
    BATCH_SET_TEI_SEARCH_PROGRAM_AND_TET: "BatchSetTeiSearchProgramAndTet",
    RESET_SEARCH_FORMS: "ResetSearchForms",
};

export const actionTypes = {
    INITIALIZE_TEI_SEARCH: "InitializeTeiSearch",
    REQUEST_SEARCH_TEI: "RequestSearchTei",
    SEARCH_FORM_VALIDATION_FAILED: "SearchFormValidationFailed",
    SEARCH_TEI_FAILED: "SearchTeiFailed",
    SEARCH_TEI_RESULT_RETRIEVED: "SearchTeiResultRetrieved",
    SET_TEI_SEARCH_PROGRAM_AND_TET: "SetTeiSearchProgramAndTet",
    TEI_NEW_SEARCH: "TeiNewSearch",
    TEI_EDIT_SEARCH: "TeiEditSearch",
    TEI_SEARCH_RESULTS_CHANGE_PAGE: "TeiSearchResultsChangePage",
    TEI_SEARCH_SET_OPEN_SEARCH_GROUP_SECTION: "TeiSearchSetOpenSearchGroupSection",
};

export const initializeTeiSearch = (searchId, programId, trackedEntityTypeId) =>
    actionCreator(actionTypes.INITIALIZE_TEI_SEARCH)({ searchId, programId, trackedEntityTypeId });

export const requestSearchTei = (formId, searchGroupId, searchId, resultsPageSize) =>
    actionCreator(actionTypes.REQUEST_SEARCH_TEI)({ formId, searchGroupId, searchId, resultsPageSize });

export const searchTeiFailed = (formId, searchGroupId, searchId) =>
    actionCreator(actionTypes.SEARCH_TEI_FAILED)({ formId, searchGroupId, searchId });

export const searchTeiResultRetrieved = (data, formId, searchGroupId, searchId) =>
    actionCreator(actionTypes.SEARCH_TEI_RESULT_RETRIEVED)({ data, formId, searchGroupId, searchId });

export const setProgramAndTrackedEntityType = (searchId, programId, trackedEntityTypeId) =>
    actionCreator(actionTypes.SET_TEI_SEARCH_PROGRAM_AND_TET)({ searchId, programId, trackedEntityTypeId });

export const searchFormValidationFailed = (formId, searchGroupId, searchId) =>
    actionCreator(actionTypes.SEARCH_FORM_VALIDATION_FAILED)({ formId, searchGroupId, searchId });

export const teiNewSearch = searchId => actionCreator(actionTypes.TEI_NEW_SEARCH)({ searchId });

export const teiEditSearch = searchId => actionCreator(actionTypes.TEI_EDIT_SEARCH)({ searchId });

export const teiSearchResultsChangePage = (searchId, pageNumber, resultsPageSize) =>
    actionCreator(actionTypes.TEI_SEARCH_RESULTS_CHANGE_PAGE)({ searchId, pageNumber, resultsPageSize });

export const setOpenSearchGroupSection = (searchId, searchGroupId) =>
    actionCreator(actionTypes.TEI_SEARCH_SET_OPEN_SEARCH_GROUP_SECTION)({ searchId, searchGroupId });
