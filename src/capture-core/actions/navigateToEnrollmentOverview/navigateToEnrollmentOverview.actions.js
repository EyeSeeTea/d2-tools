//

import { actionCreator } from "../actions.utils";

export const actionTypes = Object.freeze({
    NAVIGATE_TO_ENROLLMENT_OVERVIEW: "enrollmentNavigation.navigateToEnrollmentOverview",
});

export const navigateToEnrollmentOverview = ({ teiId, programId, orgUnitId, enrollmentId }) =>
    actionCreator(actionTypes.NAVIGATE_TO_ENROLLMENT_OVERVIEW)({ teiId, programId, orgUnitId, enrollmentId });
