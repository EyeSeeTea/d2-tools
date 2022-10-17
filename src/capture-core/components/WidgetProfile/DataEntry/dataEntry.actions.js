//
import uuid from "uuid/v4";
import { batchActions } from "redux-batched-actions";

import { convertGeometryOut } from "capture-core/components/DataEntries/converters";
import { actionCreator } from "../../../actions/actions.utils";
import { effectMethods } from "../../../trackerOffline";

import { getCurrentClientValues } from "../../../rules";
import { loadNewDataEntry } from "../../DataEntry/actions/dataEntryLoadNew.actions";
import { rulesExecutedPostUpdateField } from "../../DataEntry/actions/dataEntry.actions";
import { startRunRulesPostUpdateField } from "../../DataEntry";
import { getRulesActionsForTEI } from "./ProgramRules";
import { addFormData } from "../../D2Form/actions/form.actions";

export const TEI_MODAL_STATE = {
    OPEN: "Open",
    OPEN_ERROR: "OpenWithErrors",
    OPEN_DISABLE: "OpenAndDisabled",
    CLOSE: "Close",
};

export const dataEntryActionTypes = {
    UPDATE_FIELD_PROFILE_ACTION_BATCH: "UpdateFieldProfileActionBatch",
    OPEN_DATA_ENTRY_PROFILE_ACTION_BATCH: "OpenDataEntryProfileActionBatch",
    TEI_UPDATE: "TeiUpdate",
    TEI_UPDATE_REQUEST: "TeiSaveRequest",
    TEI_UPDATE_SUCCESS: "TeiUpdateSucess",
    TEI_UPDATE_ERROR: "TeiUpdateError",
    SET_TEI_MODAL_ERROR: "SetTeiModalError",
    SET_TEI_ATTRIBUTE_VALUES: "SetTeiAttributeValues",
    CLEAN_TEI_MODAL: "CleanTeiModal",
};
const dataEntryPropsToInclude = [
    {
        clientId: "geometry",
        dataEntryId: "geometry",
        onConvertOut: convertGeometryOut,
    },
    {
        id: "assignee",
    },
];

export const getUpdateFieldActions = (context, innerAction) => {
    const uid = uuid();
    const {
        orgUnit,
        trackedEntityAttributes,
        optionSets,
        rulesContainer,
        formFoundation,
        state,
        otherEvents,
        dataElements,
        enrollment,
        userRoles,
    } = context;
    const { dataEntryId, itemId, elementId, value, uiState } = innerAction.payload || {};
    const fieldData = {
        elementId,
        value,
        valid: uiState?.valid,
    };
    const formId = `${dataEntryId}-${itemId}`;
    const currentTEIValues = getCurrentClientValues(state, formFoundation, formId, fieldData);
    const rulesActions = getRulesActionsForTEI({
        foundation: formFoundation,
        formId,
        orgUnit,
        enrollmentData: enrollment,
        teiValues: currentTEIValues,
        trackedEntityAttributes,
        optionSets,
        rulesContainer,
        otherEvents,
        dataElements,
        userRoles,
    });

    return batchActions(
        [
            innerAction,
            ...rulesActions,
            rulesExecutedPostUpdateField(dataEntryId, itemId, uid),
            startRunRulesPostUpdateField(dataEntryId, itemId, uid),
        ],
        dataEntryActionTypes.UPDATE_FIELD_PROFILE_ACTION_BATCH
    );
};

export const setTeiModalError = hasError =>
    actionCreator(dataEntryActionTypes.SET_TEI_MODAL_ERROR)({ hasError });
export const setTeiAttributeValues = attributeValues =>
    actionCreator(dataEntryActionTypes.SET_TEI_ATTRIBUTE_VALUES)({ attributeValues });
export const cleanTeiModal = () => actionCreator(dataEntryActionTypes.CLEAN_TEI_MODAL)();

export const updateTeiRequest = ({
    itemId,
    dataEntryId,
    orgUnitId,
    trackedEntityTypeId,
    trackedEntityInstanceId,
    onSaveExternal,
    onSaveSuccessActionType,
    onSaveErrorActionType,
    formFoundation,
}) =>
    actionCreator(dataEntryActionTypes.TEI_UPDATE_REQUEST)({
        itemId,
        dataEntryId,
        orgUnitId,
        trackedEntityTypeId,
        trackedEntityInstanceId,
        formFoundation,
        onSaveExternal,
        onSaveSuccessActionType,
        onSaveErrorActionType,
    });

export const updateTei = ({ serverData, onSaveSuccessActionType, onSaveErrorActionType, uid }) =>
    actionCreator(dataEntryActionTypes.TEI_UPDATE)(
        {},
        {
            offline: {
                effect: {
                    url: "tracker?async=false",
                    method: effectMethods.POST,
                    data: serverData,
                },
                commit: { type: onSaveSuccessActionType, meta: { serverData, uid } },
                rollback: { type: onSaveErrorActionType, meta: { serverData, uid } },
            },
        }
    );

export const getOpenDataEntryActions = ({ dataEntryId, itemId, formValues }) =>
    batchActions(
        [
            ...loadNewDataEntry(dataEntryId, itemId, dataEntryPropsToInclude),
            addFormData(`${dataEntryId}-${itemId}`, formValues),
        ],
        dataEntryActionTypes.OPEN_DATA_ENTRY_PROFILE_ACTION_BATCH
    );
