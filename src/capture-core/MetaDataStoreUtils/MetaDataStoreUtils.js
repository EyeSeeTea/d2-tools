//
import {} from "../storageControllers/stores";
import { getUserStorageController } from "../storageControllers";

export const getCachedSingleResourceFromKeyAsync = (store, key, propsToPass = {}) => {
    const storageController = getUserStorageController();
    return storageController.get(store, key).then(response => ({ response, ...propsToPass }));
};

export const containsKeyInStorageAsync = (store, key, propsToPass = {}) => {
    const storageController = getUserStorageController();
    return storageController.contains(store, key).then(response => ({ response, ...propsToPass }));
};
