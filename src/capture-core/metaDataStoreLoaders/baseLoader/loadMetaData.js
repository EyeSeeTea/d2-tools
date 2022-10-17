//
import { userStores } from "../../storageControllers/stores";
import { getUserStorageController } from "../../storageControllers";
import { provideContext } from "../context";
import { loadMetaDataInternal } from "./loadMetaDataInternal";
import { upkeepUserCaches } from "../maintenance";

export const loadMetaData = async onQueryApi => {
    await upkeepUserCaches();
    await provideContext(
        {
            onQueryApi,
            storageController: getUserStorageController(),
            storeNames: userStores,
        },
        loadMetaDataInternal
    );
};
