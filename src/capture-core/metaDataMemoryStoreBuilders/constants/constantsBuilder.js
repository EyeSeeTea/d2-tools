//
import { constantsStore } from "../../metaDataMemoryStores/constants/constants.store";
import { getUserStorageController } from "../../storageControllers";

async function getConstants(storeName) {
    const storageController = getUserStorageController();
    return storageController.getAll(storeName);
}

export async function buildConstants(storeName) {
    const storeConstants = await getConstants(storeName);
    constantsStore.set(storeConstants);
}
