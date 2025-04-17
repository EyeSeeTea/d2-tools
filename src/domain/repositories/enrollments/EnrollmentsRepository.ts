import { Id } from "domain/entities/Base";
import { Async } from "domain/entities/Async";
import { Enrollment, EnrollmentStatusRef } from "domain/entities/enrollments/Enrollment";

export interface EnrollmentsRepository {
    getAllActiveRef(params: EnrollmentsRepositoryParams): Async<EnrollmentStatusRef[]>;
    getAllActive(params: EnrollmentsRepositoryParams): Async<Enrollment[]>;
    getRecentlyUpdated(params: EnrollmentsRepositoryParams): Async<Enrollment[]>;
    closeEnrollment(enrollmentId: Id): Async<TrackerResponse>;
    bulkCloseEnrollments(enrollments: Enrollment[]): Async<TrackerResponse>;
}

export type EnrollmentsRepositoryParams = {
    programId: Id;
    orgUnitId: Id;
};

export type TrackerResponse = {
    status: "OK" | "ERROR";
    message?: string;
};
