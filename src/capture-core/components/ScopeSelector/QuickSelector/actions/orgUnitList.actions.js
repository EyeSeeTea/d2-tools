//
import { actionCreator } from "capture-core/actions/actions.utils";

export const actionTypes = {
    INIT_REG_UNIT_LIST_ROOTS: "initRegUnitListRoots",
    INIT_REG_UNIT_LIST_ROOTS_FAILED: "initRegUnitListRootsFailed",
    SEARCH_ORG_UNITS: "searchRegisteringUnits",
    CLEAR_ORG_UNIT_SEARCH: "clearOrgUnitSearch",
    SET_SEARCH_ROOTS: "setRegisteringUnitSearchRoots",
    SET_SEARCH_ROOTS_FAILED: "setSearchRootsFailed",
    SHOW_LOADING_INDICATOR: "showRegUnitLoadingIndicator",
};

export const initRegUnitListRoots = roots => actionCreator(actionTypes.INIT_REG_UNIT_LIST_ROOTS)({ roots });

export const initRegUnitListRootsFailed = message =>
    actionCreator(actionTypes.INIT_REG_UNIT_LIST_ROOTS_FAILED)({ message });

export const searchOrgUnits = searchText => actionCreator(actionTypes.SEARCH_ORG_UNITS)({ searchText });

export const setSearchRootsFailed = message =>
    actionCreator(actionTypes.SET_SEARCH_ROOTS_FAILED)({ message });

export const clearOrgUnitsSearch = () => actionCreator(actionTypes.CLEAR_ORG_UNIT_SEARCH)();

export const setSearchRoots = (roots, searchText) =>
    actionCreator(actionTypes.SET_SEARCH_ROOTS)({ roots, searchText });

export const showLoadingIndicator = () => actionCreator(actionTypes.SHOW_LOADING_INDICATOR)();
