//
import { actionCreator } from "../../actions/actions.utils";

export const scopeSelectorActionTypes = {
    CATEGORY_OPTION_SET: "ScopeSelector.CategoryOptionSet",
    CATEGORY_OPTION_RESET: "ScopeSelector.CategoryOptionReset",
    ALL_CATEGORY_OPTIONS_RESET: "ScopeSelector.AllCategoryOptionsReset",
    ORG_UNIT_ID_SET: "ScopeSelector.OrgUnitSet",
};

export const setOrgUnitFromScopeSelector = orgUnitId =>
    actionCreator(scopeSelectorActionTypes.ORG_UNIT_ID_SET)({ orgUnitId });

export const setCategoryOptionFromScopeSelector = (categoryId, categoryOption) =>
    actionCreator(scopeSelectorActionTypes.CATEGORY_OPTION_SET)({ categoryId, categoryOption });
export const resetCategoryOptionFromScopeSelector = categoryId =>
    actionCreator(scopeSelectorActionTypes.CATEGORY_OPTION_RESET)({ categoryId });
export const resetAllCategoryOptionsFromScopeSelector = () =>
    actionCreator(scopeSelectorActionTypes.ALL_CATEGORY_OPTIONS_RESET)();
