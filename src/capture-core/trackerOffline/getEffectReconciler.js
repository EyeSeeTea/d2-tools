//
import { effectMethods } from "./trackerOffline.const";

export const getEffectReconciler = (() => {
    const mutateTypeForMethods = {
        [effectMethods.POST]: "create",
        [effectMethods.UPDATE]: "replace",
        [effectMethods.DELETE]: "delete",
    };

    return onApiMutate =>
        ({ url: resource, method, data }) => {
            const type = mutateTypeForMethods[method];
            return onApiMutate({ resource, type, data });
        };
})();
