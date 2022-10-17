//
import { convertServerToClient } from "../../../converters";
import { dataElementTypes } from "../../../metaData";

export const getEnrollmentForRulesEngine = ({ enrolledAt, occurredAt, enrollment } = {}) => ({
    enrollmentId: enrollment,
    // $FlowFixMe
    enrolledAt: convertServerToClient(enrolledAt, dataElementTypes.DATE),
    // $FlowFixMe
    occurredAt: convertServerToClient(occurredAt, dataElementTypes.DATE),
});
