//
import { actionCreator } from "../../../../actions/actions.utils";
// import type { EnrollmentData } from '../../Enrollment/EnrollmentPageDefault/types/common.types';

export const enrollmentSiteActionTypes = {
    COMMON_ENROLLMENT_SITE_DATA_SET: "EnrollmentSite.SetCommonData",
    UPDATE_ENROLLMENT_EVENTS: "Enrollment.UpdateEnrollmentEvents",
    UPDATE_ENROLLMENT_EVENTS_WITHOUT_ID: "Enrollment.UpdateEnrollmentEventsWithoutId",
    UPDATE_ENROLLMENT_ATTRIBUTE_VALUES: "Enrollment.UpdateEnrollmentAttributeValues",
    ROLLBACK_ENROLLMENT_EVENT: "Enrollment.RollbackEnrollmentEvent",
    ROLLBACK_ENROLLMENT_EVENT_WITHOUT_ID: "Enrollment.RollbackEnrollmentEventWithoutId",
    COMMIT_ENROLLMENT_EVENT: "Enrollment.CommitEnrollmentEvent",
    COMMIT_ENROLLMENT_EVENT_WITHOUT_ID: "Enrollment.CommitEnrollmentEventWithoutId",
    SAVE_FAILED: "Enrollment.SaveFailed",
};

export const setCommonEnrollmentSiteData = (enrollment, attributeValues) =>
    actionCreator(enrollmentSiteActionTypes.COMMON_ENROLLMENT_SITE_DATA_SET)({ enrollment, attributeValues });

export const updateEnrollmentEvents = (eventId, eventData) =>
    actionCreator(enrollmentSiteActionTypes.UPDATE_ENROLLMENT_EVENTS)({
        eventId,
        eventData,
    });

export const rollbackEnrollmentEvent = eventId =>
    actionCreator(enrollmentSiteActionTypes.ROLLBACK_ENROLLMENT_EVENT)({
        eventId,
    });

export const commitEnrollmentEvent = eventId =>
    actionCreator(enrollmentSiteActionTypes.COMMIT_ENROLLMENT_EVENT)({
        eventId,
    });

export const updateEnrollmentEventsWithoutId = (uid, eventData) =>
    actionCreator(enrollmentSiteActionTypes.UPDATE_ENROLLMENT_EVENTS_WITHOUT_ID)({
        eventData,
        uid,
    });

export const rollbackEnrollmentEventWithoutId = uid =>
    actionCreator(enrollmentSiteActionTypes.ROLLBACK_ENROLLMENT_EVENT_WITHOUT_ID)({
        uid,
    });

export const commitEnrollmentEventWithoutId = (uid, eventId) =>
    actionCreator(enrollmentSiteActionTypes.COMMIT_ENROLLMENT_EVENT_WITHOUT_ID)({
        eventId,
        uid,
    });
export const saveFailed = () => actionCreator(enrollmentSiteActionTypes.SAVE_FAILED)();

export const updateEnrollmentAttributeValues = attributeValues =>
    actionCreator(enrollmentSiteActionTypes.UPDATE_ENROLLMENT_ATTRIBUTE_VALUES)({
        attributeValues,
    });
