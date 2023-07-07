//
import {} from "../../storageControllers/stores";
import { getUserStorageController } from "../../storageControllers";

export const getCachedSingleResourceFromKeyAsync = (store, key) => {
    const storageController = getUserStorageController();
    return storageController.get(store, key);
};
