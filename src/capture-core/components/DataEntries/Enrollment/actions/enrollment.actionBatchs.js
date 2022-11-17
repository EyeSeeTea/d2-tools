//
import uuid from "uuid/v4";
import { batchActions } from "redux-batched-actions";

import { getApplicableRuleEffectsForTrackerProgram, updateRulesEffects } from "../../../../rules";
import { rulesExecutedPostUpdateField } from "../../../DataEntry/actions/dataEntry.actions";

import { startRunRulesPostUpdateField } from "../../../DataEntry";
import { startRunRulesOnUpdateForNewEnrollment } from "./enrollment.actions";

export const batchActionTypes = {
    RULES_EXECUTED_POST_UPDATE_FIELD_FOR_ENROLLMENT: "RulesExecutedPostUpdateFieldForEnrollment",
    UPDATE_FIELD_NEW_ENROLLMENT_ACTION_BATCH: "UpdateFieldNewEnrollmentActionBatch",
    UPDATE_DATA_ENTRY_FIELD_NEW_ENROLLMENT_ACTION_BATCH: "UpdateDataEntryFieldNewEnrollmentActionBatch",
};

export const runRulesOnUpdateFieldBatch = (
    program,
    foundation,
    formId,
    dataEntryId,
    itemId,
    orgUnit,
    enrollmentData,
    attributeValues,
    extraActions = [],
    uid
) => {
    const effects = getApplicableRuleEffectsForTrackerProgram({
        program,
        orgUnit,
        enrollmentData,
        attributeValues,
    });

    return batchActions(
        [
            updateRulesEffects(effects, formId),
            rulesExecutedPostUpdateField(dataEntryId, itemId, uid),
            ...extraActions,
        ],
        batchActionTypes.RULES_EXECUTED_POST_UPDATE_FIELD_FOR_ENROLLMENT
    );
};

export const updateDataEntryFieldBatch = (innerAction, programId, orgUnit) => {
    const { dataEntryId, itemId } = innerAction.payload;
    const uid = uuid();

    return batchActions(
        [
            innerAction,
            startRunRulesPostUpdateField(dataEntryId, itemId, uid),
            startRunRulesOnUpdateForNewEnrollment(innerAction.payload, uid, programId, orgUnit),
        ],
        batchActionTypes.UPDATE_DATA_ENTRY_FIELD_NEW_ENROLLMENT_ACTION_BATCH
    );
};

export const updateFieldBatch = (innerAction, programId, orgUnit) => {
    const { dataEntryId, itemId } = innerAction.payload;
    const uid = uuid();

    return batchActions(
        [
            innerAction,
            startRunRulesPostUpdateField(dataEntryId, itemId, uid),
            startRunRulesOnUpdateForNewEnrollment(innerAction.payload, uid, programId, orgUnit),
        ],
        batchActionTypes.UPDATE_FIELD_NEW_ENROLLMENT_ACTION_BATCH
    );
};

export const asyncUpdateSuccessBatch = (innerAction, dataEntryId, itemId, programId, orgUnit) => {
    const uid = uuid();

    return batchActions(
        [
            innerAction,
            startRunRulesPostUpdateField(dataEntryId, itemId, uid),
            startRunRulesOnUpdateForNewEnrollment(
                { ...innerAction.payload, dataEntryId, itemId },
                uid,
                programId,
                orgUnit
            ),
        ],
        batchActionTypes.UPDATE_FIELD_NEW_ENROLLMENT_ACTION_BATCH
    );
};
