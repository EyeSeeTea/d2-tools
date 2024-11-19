import { Id } from "domain/entities/Base";

export interface Enrollment {
    enrollment: Id;
    status: enrollmentStatus;
}

export type enrollmentStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";
