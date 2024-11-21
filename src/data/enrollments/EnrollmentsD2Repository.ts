import _ from "lodash";

import { D2Api } from "types/d2-api";
import { TrackerPostResponse } from "@eyeseetea/d2-api/api/tracker";

import { Id } from "domain/entities/Base";
import { Async } from "domain/entities/Async";
import { Enrollment, EnrollmentStatusRef, EnrollmentStatus } from "domain/entities/enrollments/Enrollment";

import {
    EnrollmentsRepository,
    EnrollmentsRepositoryParams,
    TrackerResponse,
} from "domain/repositories/enrollments/EnrollmentsRepository";

export class EnrollmentsD2Repository implements EnrollmentsRepository {
    constructor(private api: D2Api) {}

    async getAllActiveRef(params: EnrollmentsRepositoryParams): Async<EnrollmentStatusRef[]> {
        const { programId, orgUnitId } = params;

        const { instances: enrollments } = (await this.api.tracker.enrollments
            .get({
                program: programId,
                orgUnit: orgUnitId,
                ouMode: "SELECTED",
                programStatus: "ACTIVE",
                fields: enrollmentsRefFields,
                // TODO: Remove enrolledBefore once d2-api is updated
                enrolledBefore: new Date().toISOString().replace("Z", ""),
                skipPaging: true,
            })
            .getData()) as { instances: EnrollmentStatusRef[] };

        return enrollments;
    }

    // NOTE: This method will be usesd with bulkCloseEnrollments
    async getAllActive(params: EnrollmentsRepositoryParams): Async<Enrollment[]> {
        return this.getEnrollments({ ...params, programStatus: "ACTIVE" });
    }

    async getRecentlyUpdated(params: EnrollmentsRepositoryParams): Async<Enrollment[]> {
        const updatedAfter = getOneHourAgoDate();
        return this.getEnrollments({ ...params, updatedAfter });
    }

    private async getEnrollments(params: getEnrollmentsParams): Async<Enrollment[]> {
        const { programId, orgUnitId, programStatus, updatedAfter } = params;

        const { instances: enrollments } = (await this.api.tracker.enrollments
            .get({
                program: programId,
                orgUnit: orgUnitId,
                ouMode: "SELECTED",
                programStatus: programStatus,
                fields: enrollmentsFields,
                // TODO: Remove enrolledBefore once d2-api is updated
                enrolledBefore: new Date().toISOString().replace("Z", ""),
                updatedAfter: updatedAfter,
                skipPaging: true,
            })
            .getData()) as { instances: Enrollment[] };

        return enrollments;
    }

    async closeEnrollment(enrollmentId: Id): Async<TrackerResponse> {
        const putResponse = await this.api.put<void>(`/enrollments/${enrollmentId}/completed`).response();

        const response: TrackerResponse =
            putResponse.status === 204
                ? { status: "OK", message: `Enrollment ${enrollmentId} closed` }
                : {
                      status: "ERROR",
                      message: `PUT staus code: ${putResponse.status} for Enrollment: ${enrollmentId} `,
                  };

        return response;
    }

    // NOTE: The close method can be swithced to this once a newer version of DHIS2 is used
    async bulkCloseEnrollments(enrollments: Enrollment[]): Async<TrackerResponse> {
        const response = (await this.api
            .post<TrackerPostResponse>(
                "/tracker",
                {
                    importStrategy: "UPDATE",
                    async: false,
                },
                {
                    enrollments: enrollments,
                }
            )
            .getData()) as TrackerResponse;

        return response;
    }
}

const enrollmentsRefFields = {
    enrollment: true,
    status: true,
} as const;

const enrollmentsFields = {
    enrollment: true,
    createdAt: true,
    createdAtClient: true,
    updatedAt: true,
    updatedAtClient: true,
    trackedEntity: true,
    program: true,
    status: true,
    orgUnit: true,
    orgUnitName: true,
    enrolledAt: true,
    occurredAt: true,
    followUp: true,
    deleted: true,
    storedBy: true,
    notes: true,
} as const;

export type getEnrollmentsParams = {
    programId: Id;
    orgUnitId: Id;
    programStatus?: EnrollmentStatus;
    updatedAfter?: string;
};

function getOneHourAgoDate() {
    const today = new Date();
    const updatedAfter = new Date(today.getTime() - 1 * 60 * 60 * 1000).toISOString().replace("Z", "");
    return updatedAfter;
}
