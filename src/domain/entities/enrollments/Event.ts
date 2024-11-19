import { Id } from "domain/entities/Base";
import { enrollmentStatus } from "domain/entities/enrollments/Enrollment";

export interface Event {
    event: Id;
    status: "ACTIVE" | "COMPLETED" | "CANCELLED";
    program: Id;
    orgUnit: Id;
    updatedAt: string;
    enrollment: Id;
    enrollmentStatus: enrollmentStatus;
}
