//
import { useDispatch } from "react-redux";
import { useCallback, useContext } from "react";
import { useCurrentOrgUnitInfo } from "../../hooks/useCurrentOrgUnitInfo";
import { changePage, reviewDuplicates } from "./possibleDuplicatesDialog.actions";
import { ResultsPageSizeContext } from "../Pages/shared-contexts";
import { useScopeInfo } from "../../hooks/useScopeInfo";

export const useDuplicates = (dataEntryId, selectedScopeId) => {
    const { resultsPageSize } = useContext(ResultsPageSizeContext);
    const dispatch = useDispatch();
    const { scopeType } = useScopeInfo(selectedScopeId);
    const { id: orgUnitId } = useCurrentOrgUnitInfo();
    const dispatchOnReviewDuplicates = useCallback(() => {
        dispatch(
            reviewDuplicates({
                pageSize: resultsPageSize,
                orgUnitId,
                selectedScopeId,
                scopeType,
                dataEntryId,
            })
        );
    }, [dispatch, orgUnitId, selectedScopeId, scopeType, dataEntryId, resultsPageSize]);

    const dispatchPageChangeOnReviewDuplicates = useCallback(
        page => {
            dispatch(
                changePage({
                    page,
                    pageSize: resultsPageSize,
                    orgUnitId,
                    selectedScopeId,
                    scopeType,
                    dataEntryId,
                })
            );
        },
        [dispatch, orgUnitId, selectedScopeId, scopeType, dataEntryId, resultsPageSize]
    );

    return {
        onReviewDuplicates: dispatchOnReviewDuplicates,
        changePageOnReviewDuplicates: dispatchPageChangeOnReviewDuplicates,
    };
};
