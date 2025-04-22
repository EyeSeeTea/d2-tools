import { Id } from "domain/entities/Base";
import { EnrollmentStatus } from "domain/entities/enrollments/Enrollment";

export interface Event {
    event: Id;
    status: "ACTIVE" | "COMPLETED" | "CANCELLED";
    program: Id;
    orgUnit: Id;
    updatedAt: string;
    occurredAt: string;
    enrollment: Id;
    enrollmentStatus: EnrollmentStatus;
}
