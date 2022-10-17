//
import { ofType } from "redux-observable";
import { mergeMap, catchError } from "rxjs/operators";
import { EMPTY } from "rxjs";
import { saveDataStore } from "./DataStore.actions";
import { getApi } from "../../d2";
import {} from "./DataStore.types";
import { appStartActionTypes } from "../../../../components/AppStart";

function getDataStoreFromApi() {
    const api = getApi();
    return api.get("dataStore/capture/useNewDashboard");
}

const getUserDataStoreFromApi = () => {
    const api = getApi();
    return api.get("userDataStore/capture/useNewDashboard");
};

export const fetchDataStoreEpic = action$ =>
    action$.pipe(
        ofType(appStartActionTypes.APP_LOAD_SUCESS),
        mergeMap(async () => {
            const apiDataStore = await getDataStoreFromApi();
            // $FlowFixMe
            return saveDataStore({ dataStore: apiDataStore });
        }),
        catchError(() => EMPTY)
    );

export const fetchUserDataStoreEpic = action$ =>
    action$.pipe(
        ofType(appStartActionTypes.APP_LOAD_SUCESS),
        mergeMap(async () => {
            const apiUserDataStore = await getUserDataStoreFromApi();
            // $FlowFixMe
            return saveDataStore({ userDataStore: apiUserDataStore });
        }),
        catchError(() => EMPTY)
    );
