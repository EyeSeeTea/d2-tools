import { Id } from "domain/entities/Base";
import { Async } from "domain/entities/Async";
import { Enrollment } from "domain/entities/enrollments/Enrollment";
// import { Stats } from "domain/entities/Stats";

export interface EnrollmentsRepository {
    getList(params: EnrollmentsRepositoryParams, enrollmentsIds: Id[]): Async<Enrollment[]>;
    getAll(params: EnrollmentsRepositoryParams): Async<Enrollment[]>;
    closeEnrollment(enrollmentId: Id): Async<TrackerResponse>;
}

export type EnrollmentsRepositoryParams = {
    programId: Id;
    orgUnitId: Id;
};

export type TrackerResponse = {
    status: "OK" | "ERROR";
    message?: string;
};
