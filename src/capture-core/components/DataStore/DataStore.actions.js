//
import { actionCreator } from "../../actions/actions.utils";
import { actionTypes as dataStoreActionTypes } from "./DataStore.types";

export const saveDataStore = ({ dataStore, userDataStore }) =>
    actionCreator(dataStoreActionTypes.SAVE_DATA_STORE)({ dataStore, userDataStore });
