//

import { actionCreator, actionPayloadAppender } from "../../../../actions/actions.utils";

export const actionTypes = {
    START_RUN_RULES_ON_UPDATE: "StartRunRulesOnUpdateForNewEnrollment",
};

export const startRunRulesOnUpdateForNewEnrollment = (payload, uid, programId, orgUnit) =>
    actionCreator(actionTypes.START_RUN_RULES_ON_UPDATE)({ innerPayload: payload, uid, programId, orgUnit });

export const startAsyncUpdateFieldForNewEnrollment = (innerAction, onSuccess, onError) =>
    actionPayloadAppender(innerAction)({ onSuccess, onError });
