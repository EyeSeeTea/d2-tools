import { Id } from "domain/entities/Base";

export type EnrollmentStatusRef = {
    enrollment: Id;
    status: EnrollmentStatus;
};

export type Enrollment = EnrollmentStatusRef & {
    createdAt: string;
    createdAtClient: string;
    updatedAt?: string;
    updatedAtClient?: string;
    trackedEntity: Id;
    program: Id;
    orgUnit: Id;
    orgUnitName: string;
    enrolledAt: string;
    occurredAt: string;
    followUp: boolean;
    deleted: boolean;
    storedBy: string;
    notes: any[];
};

export type EnrollmentStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";
