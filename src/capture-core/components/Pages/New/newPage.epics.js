//
import { ofType } from "redux-observable";
import { switchMap } from "rxjs/operators";
import { lockedSelectorActionTypes } from "../../LockedSelector/LockedSelector.actions";
import { topBarActionsActionTypes } from "../../TopBarActions/TopBarActions.actions";
import { buildUrlQueryString, deriveURLParamsFromLocation } from "../../../utils/routing";
import { resetLocationChange } from "../../LockedSelector/QuickSelector/actions/QuickSelector.actions";

export const openNewRegistrationPageFromLockedSelectorEpic = (action$, _, { history }) =>
    action$.pipe(
        ofType(
            lockedSelectorActionTypes.NEW_REGISTRATION_PAGE_OPEN,
            topBarActionsActionTypes.NEW_REGISTRATION_PAGE_OPEN
        ),
        switchMap(() => {
            const { orgUnitId, programId } = deriveURLParamsFromLocation();
            history.push(`/new?${buildUrlQueryString({ programId, orgUnitId })}`);
            return new Promise(resolve => {
                setTimeout(() => resolve(resetLocationChange()), 0);
            });
        })
    );
