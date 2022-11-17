//
import { createReducerDescription } from "../../trackerRedux/trackerReducer";
import { newPageActionTypes } from "../../components/Pages/New/NewPage.actions";
import { newPageStatuses } from "../../components/Pages/New/NewPage.constants";

const initialNewPageState = {
    newPageStatus: newPageStatuses.DEFAULT,
};

export const newPageDesc = createReducerDescription(
    {
        [newPageActionTypes.NEW_PAGE_DEFAULT_VIEW]: state => ({
            ...state,
            newPageStatus: newPageStatuses.DEFAULT,
        }),
        [newPageActionTypes.NEW_PAGE_WITHOUT_ORG_UNIT_SELECTED_VIEW]: state => ({
            ...state,
            newPageStatus: newPageStatuses.WITHOUT_ORG_UNIT_SELECTED,
        }),
        [newPageActionTypes.NEW_PAGE_WITHOUT_PROGRAM_CATEGORY_SELECTED_VIEW]: state => ({
            ...state,
            newPageStatus: newPageStatuses.WITHOUT_PROGRAM_CATEGORY_SELECTED,
        }),
    },
    "newPage",
    initialNewPageState
);
