//
import { actionCreator } from "../../../../actions/actions.utils";

export const actionTypes = {
    DATA_ENTRY_NEW_ENROLLMENT_OPEN: "OpenDataEntryForNewEnrollment",
};

export const openDataEntryForNewEnrollment = (dataEntryId, generatedUniqueValues) =>
    actionCreator(actionTypes.DATA_ENTRY_NEW_ENROLLMENT_OPEN)({ dataEntryId, generatedUniqueValues });
