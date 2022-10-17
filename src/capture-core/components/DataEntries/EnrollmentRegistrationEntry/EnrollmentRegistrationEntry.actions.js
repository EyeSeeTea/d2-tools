//
import { actionCreator } from "../../../actions/actions.utils";

export const enrollmentRegistrationEntryActionTypes = {
    TRACKER_PROGRAM_REGISTRATION_ENTRY_INITIALISATION_START: "StartInitForEnrollmentRegistrationForm",
};

export const startNewEnrollmentDataEntryInitialisation = ({
    selectedOrgUnit,
    selectedScopeId,
    dataEntryId,
    formValues,
    clientValues,
}) =>
    actionCreator(
        enrollmentRegistrationEntryActionTypes.TRACKER_PROGRAM_REGISTRATION_ENTRY_INITIALISATION_START
    )({ selectedOrgUnit, selectedScopeId, dataEntryId, formValues, clientValues });
