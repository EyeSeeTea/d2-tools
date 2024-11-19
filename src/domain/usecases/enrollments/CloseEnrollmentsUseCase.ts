import _ from "lodash";
import log from "utils/log";

import { Async } from "domain/entities/Async";

import { EventsRepository, EventsRepositoryParams } from "domain/repositories/enrollments/EventsRepository";
import {
    EnrollmentsRepository,
    EnrollmentsRepositoryParams,
    TrackerResponse,
} from "domain/repositories/enrollments/EnrollmentsRepository";

export class CloseEnrollmentsUseCase {
    constructor(
        private eventsRepository: EventsRepository,
        private enrollmentsRepository: EnrollmentsRepository
    ) {}

    async execute(params: EventsRepositoryParams): Async<void> {
        const events = await this.eventsRepository.getAll(params);

        const enrollmentsIDs = _.uniqBy(events, "enrollment").flatMap(event => event.enrollment);

        if (enrollmentsIDs.length === 0) {
            log.info("No Enrollments for the provided date");
            return;
        }

        const enrollmentsParams: EnrollmentsRepositoryParams = {
            programId: params.programId,
            orgUnitId: params.orgUnitId,
        };

        const enrollments = await this.enrollmentsRepository.getAll(enrollmentsParams);

        const activeEnrollmentsIDs = enrollments
            .filter(enrollment => enrollment.status === "ACTIVE")
            .filter(enrollment => enrollmentsIDs.includes(enrollment.enrollment))
            .map(enrollment => enrollment.enrollment);

        if (activeEnrollmentsIDs.length === 0) {
            log.info("No active Enrollments found for the provided date");
            return;
        }

        log.info(`Found ${activeEnrollmentsIDs.length} active enrollments to close`);

        activeEnrollmentsIDs.forEach(async enrollmentId => {
            const report: TrackerResponse = await this.enrollmentsRepository.closeEnrollment(enrollmentId);

            if (report.status === "ERROR") {
                console.error(report.message);
            }

            // NOTE: Added to not overload the server
            await new Promise(resolve => setTimeout(resolve, 25));
        });
    }
}
