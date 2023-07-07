//
import { actionCreator } from "../../../../actions/actions.utils";

export const actionTypes = {
    DATA_ENTRY_NEW_TEI_OPEN: "OpenDataEntryForNewTEI",
};

export const openDataEntryForNewTei = (dataEntryId, generatedUniqueValues) =>
    actionCreator(actionTypes.DATA_ENTRY_NEW_TEI_OPEN)({ dataEntryId, generatedUniqueValues });
