//

let context;

export const provideContext = async ({ onQueryApi, storageController, storeNames }, callback) => {
    context = {
        onQueryApi,
        storageController,
        storeNames,
    };
    await callback();
    context = null;
};

export const getContext = () => {
    if (!context) {
        throw Error("metadata loader context not set");
    }
    return context;
};
