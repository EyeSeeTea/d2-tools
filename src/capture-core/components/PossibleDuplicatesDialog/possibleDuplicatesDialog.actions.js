//
import { actionCreator } from "../../actions/actions.utils";

export const actionTypes = {
    DUPLICATES_REVIEW: "PossibleDuplicatesReview",
    DUPLICATES_REVIEW_RETRIEVAL_SUCCESS: "PossibleDuplicatesReviewRetrievalSuccess",
    DUPLICATES_REVIEW_RETRIEVAL_FAILED: "PossibleDuplicatesReviewRetrievalFailed",
    DUPLICATES_REVIEW_CHANGE_PAGE: "PossibleDuplicatesChangePage",
};

export const reviewDuplicates = ({ pageSize, orgUnitId, selectedScopeId, scopeType, dataEntryId }) =>
    actionCreator(actionTypes.DUPLICATES_REVIEW)({
        pageSize,
        page: 1,
        orgUnitId,
        selectedScopeId,
        scopeType,
        dataEntryId,
    });

export const duplicatesForReviewRetrievalSuccess = (teis, currentPage) =>
    actionCreator(actionTypes.DUPLICATES_REVIEW_RETRIEVAL_SUCCESS)({ teis, currentPage });

export const duplicatesForReviewRetrievalFailed = () =>
    actionCreator(actionTypes.DUPLICATES_REVIEW_RETRIEVAL_FAILED)();

export const changePage = ({ pageSize, page, orgUnitId, selectedScopeId, scopeType, dataEntryId }) =>
    actionCreator(actionTypes.DUPLICATES_REVIEW_CHANGE_PAGE)({
        page,
        pageSize,
        orgUnitId,
        selectedScopeId,
        scopeType,
        dataEntryId,
    });
