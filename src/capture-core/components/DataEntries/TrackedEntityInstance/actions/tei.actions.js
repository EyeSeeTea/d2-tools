//
import { actionPayloadAppender } from "../../../../actions/actions.utils";

export const startAsyncUpdateFieldForNewTei = (innerAction, onSuccess, onError) =>
    actionPayloadAppender(innerAction)({ onSuccess, onError });
