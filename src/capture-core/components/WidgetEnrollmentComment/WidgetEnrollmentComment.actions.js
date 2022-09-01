//
import { actionCreator } from "../../actions/actions.utils";
import { effectMethods } from "../../trackerOffline";

export const actionTypes = {
    REQUEST_ADD_NOTE_FOR_ENROLLMENT: "RequestAddNoteForEnrollment",
    START_ADD_NOTE_FOR_ENROLLMENT: "StartAddNoteForEnrollment",
    NOTE_ADDED_FOR_ENROLLMENT: "NoteAddedForEnrollment",
    ADD_ENROLLMENT_NOTE: "AddEnrollmentNote",
    ADD_NOTE_FAILED_FOR_ENROLLMENT: "AddNoteFailedForEnrollment",
};

export const batchActionTypes = {
    ADD_NOTE_BATCH_FOR_ENROLLMENT: "AddNoteBatchForEnrollment",
    REMOVE_NOTE_BATCH_FOR_ENROLLMENT: "RemoveNoteBatchForEnrollment",
};

export const requestAddNoteForEnrollment = (enrollmentId, note) =>
    actionCreator(actionTypes.REQUEST_ADD_NOTE_FOR_ENROLLMENT)({ enrollmentId, note });

export const startAddNoteForEnrollment = (enrollmentId, serverData, selections, context) =>
    actionCreator(actionTypes.START_ADD_NOTE_FOR_ENROLLMENT)(
        { selections, context },
        {
            offline: {
                effect: {
                    url: `enrollments/${enrollmentId}/note`,
                    method: effectMethods.POST,
                    data: serverData,
                },
                commit: { type: actionTypes.NOTE_ADDED_FOR_ENROLLMENT, meta: { selections, context } },
                rollback: { type: actionTypes.ADD_NOTE_FAILED_FOR_ENROLLMENT, meta: { selections, context } },
            },
        }
    );

export const addEnrollmentNote = (enrollmentId, note) =>
    actionCreator(actionTypes.ADD_ENROLLMENT_NOTE)({ enrollmentId, note });
