//
import React, { useCallback } from "react";
import { useDispatch } from "react-redux";
import Grid from "@material-ui/core/Grid";
import {
    ScopeSelector,
    useResetViewEventId,
    setCategoryOptionFromScopeSelector,
    resetCategoryOptionFromScopeSelector,
    resetAllCategoryOptionsFromScopeSelector,
} from "../../ScopeSelector";

import { TopBarActions } from "../../TopBarActions";

export const TopBar = ({ programId, orgUnitId, selectedCategories, isUserInteractionInProgress }) => {
    const dispatch = useDispatch();
    const { resetViewEventId } = useResetViewEventId();
    const dispatchOnSetCategoryOption = useCallback(
        (categoryOption, categoryId) => {
            dispatch(setCategoryOptionFromScopeSelector(categoryId, categoryOption));
        },
        [dispatch]
    );

    const dispatchOnResetCategoryOption = useCallback(
        categoryId => {
            dispatch(resetCategoryOptionFromScopeSelector(categoryId));
        },
        [dispatch]
    );

    const dispatchOnResetAllCategoryOptions = useCallback(() => {
        dispatch(resetAllCategoryOptionsFromScopeSelector());
    }, [dispatch]);

    return (
        <ScopeSelector
            selectedProgramId={programId}
            selectedOrgUnitId={orgUnitId}
            selectedCategories={selectedCategories}
            onResetProgramId={() => resetViewEventId("/", { orgUnitId })}
            onResetOrgUnitId={() => resetViewEventId("/", { programId })}
            onSetCategoryOption={dispatchOnSetCategoryOption}
            onResetAllCategoryOptions={dispatchOnResetAllCategoryOptions}
            onResetCategoryOption={dispatchOnResetCategoryOption}
            isUserInteractionInProgress={isUserInteractionInProgress}
        >
            <Grid item xs={12} sm={6} md={6} lg={2}>
                <TopBarActions
                    selectedProgramId={programId}
                    selectedOrgUnitId={orgUnitId}
                    isUserInteractionInProgress={isUserInteractionInProgress}
                />
            </Grid>
        </ScopeSelector>
    );
};
