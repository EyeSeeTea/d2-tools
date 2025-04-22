import _ from "lodash";
import { promiseMap } from "data/dhis2-utils";
import { Id, NamedRef } from "domain/entities/Base";
import logger from "utils/log";
import { Maybe } from "utils/ts-utils";
import { ProgramsRepository } from "domain/repositories/ProgramsRepository";
import { NotificationsRepository } from "domain/repositories/NotificationsRepository";
import { ProgramEventsRepository } from "domain/repositories/ProgramEventsRepository";
import { TrackedEntityRepository } from "domain/repositories/TrackedEntityRepository";
import { Enrollment, TrackedEntity } from "domain/entities/TrackedEntity";
import { ProgramEvent, ProgramEventToSave } from "domain/entities/ProgramEvent";

export class DetectExternalOrgUnitUseCase {
    constructor(
        private programRepository: ProgramsRepository,
        private trackedEntityRepository: TrackedEntityRepository,
        private eventsRepository: ProgramEventsRepository,
        private notificationRepository: NotificationsRepository
    ) {}

    async execute(options: {
        programIds?: Id[];
        post: boolean;
        notification: Maybe<{ subject: string; recipients: string[] }>;
    }) {
        const programs = await this.getPrograms(options);

        const reports = await promiseMap(programs, async program => {
            const { report, mismatchRecords } = await this.getEventsOutsideEnrollment({ program: program });

            if (_(mismatchRecords).isEmpty()) {
                logger.debug(`No events outside its enrollment orgUnit`);
            } else if (!options.post) {
                logger.info(`Add --post to update events (${mismatchRecords.length})`);
            } else {
                await this.fixMismatchEvents(mismatchRecords);
            }

            return report;
        });

        const report = joinReports(reports);

        if (report.events > 0 && options.notification) {
            await this.notify(report, { post: options.post, ...options.notification });
        }
    }

    private async notify(report: Report, options: { post: boolean; subject: string; recipients: string[] }) {
        const status = options.post ? "fixed" : "detected";

        const body = [
            `${report.events} events outside its enrollment organisation unit [${status}]`,
            "",
            report.contents,
        ];

        await this.notificationRepository.send({
            recipients: options.recipients,
            subject: options.subject,
            body: { type: "text", contents: body.join("\n") },
            attachments: [],
        });
    }

    private async getPrograms(options: { programIds?: Id[] }) {
        logger.info(`Get tracker programs`);
        const programs = await this.programRepository.get({
            programTypes: ["WITH_REGISTRATION"],
            ids: options.programIds,
        });
        logger.info(`Total tracker programs: ${programs.length}`);
        return programs;
    }

    async getEventsOutsideEnrollment(options: {
        program: NamedRef;
    }): Promise<{ report: Report; mismatchRecords: MismatchRecord[] }> {
        logger.debug(`Get tracked entities for program: ${options.program.id}`);
        const trackedEntities = await this.trackedEntityRepository.getAll({ programId: options.program.id });
        const mismatchRecords = this.getMismatchRecords(trackedEntities);
        const reportContents = this.getMismatchRecordsInfo(mismatchRecords);
        logger.info(`Events outside its enrollment orgUnit: ${mismatchRecords.length}`);
        logger.info(reportContents);
        const report: Report = { contents: reportContents, events: mismatchRecords.length };

        return { report: report, mismatchRecords: mismatchRecords };
    }

    private async fixMismatchEvents(mismatchRecords: MismatchRecord[]) {
        const events = mismatchRecords.map(obj => obj.event);
        const mismatchRecordsByEventId = _.keyBy(mismatchRecords, obj => obj.event.id);

        const fixedEvents = events.map((event): ProgramEventToSave => {
            const obj = mismatchRecordsByEventId[event.id];
            if (!obj) throw new Error(`Event not found: ${event.id}`);
            return { ...event, orgUnit: obj.enrollment.orgUnit };
        });

        await this.saveEvents(fixedEvents);
    }

    private async saveEvents(events: ProgramEventToSave[]) {
        logger.info(`Post events: ${events.length}`);
        const response = await this.eventsRepository.save(events);
        logger.info(`Post result: ${JSON.stringify(response)}`);
    }

    private getMismatchRecordsInfo(mismatchRecords: MismatchRecord[]): string {
        return mismatchRecords
            .map(obj => {
                const { trackedEntity: tei, enrollment: enrollment, event } = obj;

                const msg = [
                    `trackedEntity: id=${tei.id} orgUnit="${enrollment.orgUnit.name}" [${enrollment.orgUnit.id}]`,
                    `event: id=${event.id} orgUnit="${event.orgUnit.name}" [${event.orgUnit.id}]`,
                ];

                return msg.join(" - ");
            })
            .join("\n");
    }

    private getMismatchRecords(trackedEntities: TrackedEntity[]): MismatchRecord[] {
        return _(trackedEntities)
            .flatMap(trackedEntity => {
                return _(trackedEntity.enrollments)
                    .flatMap(enrollment => {
                        return enrollment.events.map(event => {
                            if (event.orgUnit.id !== enrollment.orgUnit.id) {
                                return {
                                    trackedEntity: trackedEntity,
                                    enrollment: enrollment,
                                    event: event,
                                };
                            }
                        });
                    })
                    .compact()
                    .value();
            })
            .value();
    }
}

type MismatchRecord = {
    trackedEntity: TrackedEntity;
    enrollment: Enrollment;
    event: ProgramEvent;
};

type Report = {
    contents: string;
    events: number;
};

function joinReports(reports: Report[]): Report {
    return {
        contents: _(reports)
            .map(report => report.contents)
            .compact()
            .join("\n"),
        events: _(reports)
            .map(report => report.events)
            .sum(),
    };
}
