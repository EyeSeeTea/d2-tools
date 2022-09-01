//
import { actionCreator } from "../../../../actions/actions.utils";

export const actionTypes = {
    REGISTER_TEI_INITIALIZE: "InitializeRegisterTei",
    REGISTER_TEI_INITIALIZE_FAILED: "InitializeRegisterTeiFailed",
};

export const initializeRegisterTei = (programId, orgUnit) =>
    actionCreator(actionTypes.REGISTER_TEI_INITIALIZE)({ programId, orgUnit });

export const initializeRegisterTeiFailed = errorMessage =>
    actionCreator(actionTypes.REGISTER_TEI_INITIALIZE_FAILED)({ errorMessage });
