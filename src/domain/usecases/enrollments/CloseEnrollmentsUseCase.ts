import _ from "lodash";
import fs from "fs";
import path from "path";
import log from "utils/log";
import { promiseMap } from "data/dhis2-utils";

import { Async } from "domain/entities/Async";
import { Enrollment } from "domain/entities/enrollments/Enrollment";

import { EventsRepository, EventsRepositoryParams } from "domain/repositories/enrollments/EventsRepository";
import {
    EnrollmentsRepository,
    EnrollmentsRepositoryParams,
} from "domain/repositories/enrollments/EnrollmentsRepository";

export class CloseEnrollmentsUseCase {
    constructor(
        private eventsRepository: EventsRepository,
        private enrollmentsRepository: EnrollmentsRepository
    ) {}

    async execute(params: EventsRepositoryParams): Async<void> {
        // Get all events for the provided date
        const events = await this.eventsRepository.getAll(params);
        const enrollmentsIDs = _.uniqBy(events, "enrollment").flatMap(event => event.enrollment);
        if (enrollmentsIDs.length === 0) {
            log.info("No Enrollments for the provided date");
            return;
        }

        // Get all active enrollments for the provided program and orgUnit
        const enrollmentsParams: EnrollmentsRepositoryParams = {
            programId: params.programId,
            orgUnitId: params.orgUnitId,
        };
        const activeEnrollments = await this.enrollmentsRepository.getAllActiveRef(enrollmentsParams);

        // Filter active enrollments to close
        const enrollmentsToClose = activeEnrollments.filter(enrollment =>
            enrollmentsIDs.includes(enrollment.enrollment)
        );

        const enrollmentsToCloseIDs = enrollmentsToClose.map(enrollment => enrollment.enrollment);
        const enrollmentsToCloseCount = enrollmentsToCloseIDs.length;

        if (enrollmentsToCloseCount === 0) {
            log.info("No active Enrollments found for the provided date");
            return;
        }
        log.info(`Found ${enrollmentsToCloseCount} active enrollments to close`);

        // Close enrollments
        log.info("Closing enrollments, please wait...");
        const responses = await promiseMap(enrollmentsToCloseIDs, enrollmentId =>
            this.enrollmentsRepository.closeEnrollment(enrollmentId)
        );

        log.debug(`Close enrollments responses: ${JSON.stringify(responses, null, 2)}`);

        // Get updated enrollments to check if they were correctly closed
        const updatedEnrollments = await this.enrollmentsRepository.getRecentlyUpdated(enrollmentsParams);

        const closeErrors = updatedEnrollments
            .filter(enrollment => enrollmentsToCloseIDs.includes(enrollment.enrollment))
            .filter(enrollment => enrollment.status === "ACTIVE");

        const closeErrorIDs = closeErrors.map(enrollment => enrollment.enrollment);

        if (closeErrorIDs.length === 0) {
            log.info(`Closed ${enrollmentsToCloseCount} enrollments`);
        } else {
            log.error(`Found ${closeErrorIDs.length} enrollments that could not be closed`);
            storeErrors(closeErrors);
        }
    }
}

function storeErrors(closeErrors: Enrollment[]) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filePath = path.join(process.cwd(), `close_errors_${timestamp}.json`);

    fs.writeFileSync(filePath, JSON.stringify(closeErrors, null, 2), "utf-8");

    log.info(`Enrollments with close errors written to ${filePath}`);
}