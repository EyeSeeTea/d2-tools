import _ from "lodash";

import { D2Api } from "types/d2-api";

import { Id } from "domain/entities/Base";
import { Async } from "domain/entities/Async";
import { Enrollment } from "domain/entities/enrollments/Enrollment";

import {
    EnrollmentsRepository,
    EnrollmentsRepositoryParams,
    TrackerResponse,
} from "domain/repositories/enrollments/EnrollmentsRepository";

export class EnrollmentsD2Repository implements EnrollmentsRepository {
    constructor(private api: D2Api) {}

    async getList(params: EnrollmentsRepositoryParams, enrollmentsIds: Id[]): Async<Enrollment[]> {
        const { programId, orgUnitId } = params;

        const idList = enrollmentsIds.join(";");

        // NOTE: looks like @eyeseetea/d2-api/api/trackerEnrollments.d.ts: Params is not interpreted correctly and marked as required
        const { instances: enrollments } = (await this.api.tracker.enrollments
            .get({
                program: programId,
                orgUnit: orgUnitId,
                ouMode: "SELECTED",
                fields: { enrollment: true, status: true },
                enrolledBefore: `${new Date().toISOString().replace("Z", "")}`,
                enrollment: idList,
                skipPaging: true,
            })
            .getData()) as { instances: Enrollment[] };

        return enrollments;
    }

    async getAll(params: EnrollmentsRepositoryParams): Async<Enrollment[]> {
        const { programId, orgUnitId } = params;

        const { instances: enrollments } = (await this.api.tracker.enrollments
            .get({
                program: programId,
                orgUnit: orgUnitId,
                ouMode: "SELECTED",
                fields: { enrollment: true, status: true },
                enrolledBefore: `${new Date().toISOString().replace("Z", "")}`,
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
}
