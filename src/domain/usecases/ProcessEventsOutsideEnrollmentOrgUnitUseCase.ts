import _ from "lodash";
import { promiseMap } from "data/dhis2-utils";
import { NamedRef } from "domain/entities/Base";
import { D2Api } from "types/d2-api";
import logger from "utils/log";
import { D2TrackerTrackedEntitySchema } from "@eyeseetea/d2-api/api/trackerTrackedEntities";
import { ProgramsRepository } from "domain/repositories/ProgramsRepository";
import { SelectedPick } from "@eyeseetea/d2-api/api/inference";
import { D2TrackerEventSchema } from "@eyeseetea/d2-api/api/trackerEvents";
import { NotificationsRepository } from "domain/repositories/NotificationsRepository";
import { Maybe } from "utils/ts-utils";

export class DetectExternalOrgUnitUseCase {
    pageSize = 1000;

    constructor(
        private api: D2Api,
        private programRepository: ProgramsRepository,
        private notificationRepository: NotificationsRepository
    ) {}

    async execute(options: {
        post: boolean;
        notification: Maybe<{ subject: string; recipients: string[] }>;
    }) {
        const programs = await this.getPrograms();

        const report = joinReports(
            await promiseMap(programs, async program => {
                return this.fixEventsInProgram({ program: program, post: options.post });
            })
        );

        if (report.events > 0 && options.notification) {
            const status = options.post ? "fixed" : "detected";

            const body = [
                `${report.events} events outside its enrollment organisation unit [${status}]`,
                "",
                report.contents,
            ];

            await this.notificationRepository.send({
                recipients: options.notification.recipients,
                subject: options.notification.subject,
                body: { type: "text", contents: body.join("\n") },
                attachments: [],
            });
        }
    }

    private async getPrograms() {
        logger.info(`Get tracker programs`);
        const programs = await this.programRepository.get({ programTypes: ["WITH_REGISTRATION"] });
        logger.info(`Total tracker programs: ${programs.length}`);
        return programs;
    }

    async fixEventsInProgram(options: { program: NamedRef; post: boolean }): Promise<Report> {
        const pageCount = await this.getPageCount(options);

        const reports = await promiseMap(_.range(1, pageCount + 1), async page => {
            return this.fixEventsForPage({ ...options, page: page, pageCount: pageCount });
        });

        return joinReports(reports);
    }

    private async getPageCount(options: { program: NamedRef; post: boolean }) {
        const response = await this.api.tracker.trackedEntities
            .get({
                ...params,
                page: 1,
                pageSize: 0,
                totalPages: true,
                program: options.program.id,
            })
            .getData();

        return Math.ceil((response.total || 0) / this.pageSize);
    }

    async fixEventsForPage(options: {
        program: NamedRef;
        page: number;
        pageCount: number;
        post: boolean;
    }): Promise<Report> {
        const trackedEntities = await this.getTrackedEntities(options);
        const mismatchRecords = this.getMismatchRecords(trackedEntities);
        const report = this.buildReport(mismatchRecords);
        logger.info(`Events outside its enrollment orgUnit: ${mismatchRecords.length}`);

        if (_(mismatchRecords).isEmpty()) {
            logger.debug(`No events outside its enrollment orgUnit`);
        } else if (!options.post) {
            logger.info(`Add --post to update events (${mismatchRecords.length})`);
        } else {
            await this.fixMismatchEvents(mismatchRecords);
        }

        return { contents: report, events: mismatchRecords.length };
    }

    private async fixMismatchEvents(mismatchRecords: MismatchRecord[]) {
        const eventIds = mismatchRecords.map(obj => obj.event.event);
        const mismatchRecordsByEventId = _.keyBy(mismatchRecords, obj => obj.event.event);

        logger.info(`Get events to update: ${eventIds.join(",")}`);
        const { instances: events } = await this.api.tracker.events
            .get({ fields: { $all: true }, event: eventIds.join(";") })
            .getData();

        const fixedEvents = events.map((event): typeof event => {
            const obj = mismatchRecordsByEventId[event.event];
            if (!obj) throw new Error(`Event not found: ${event.event}`);
            return { ...event, orgUnit: obj.enrollment.orgUnit };
        });

        await this.saveEvents(fixedEvents);
    }

    private async saveEvents(events: D2TrackerToSave[]) {
        logger.info(`Post events: ${events.length}`);

        const response = await this.api.tracker
            .post(
                {
                    async: false,
                    skipPatternValidation: true,
                    skipSideEffects: true,
                    skipRuleEngine: true,
                    importMode: "COMMIT",
                },
                { events: events }
            )
            .getData();

        logger.info(`Post result: ${JSON.stringify(response.stats)}`);
    }

    private buildReport(mismatchRecords: MismatchRecord[]): string {
        return mismatchRecords
            .map(obj => {
                const { trackedEntity: tei, enrollment: enr, event } = obj;

                const msg = [
                    `trackedEntity: id=${tei.trackedEntity} orgUnit="${enr.orgUnitName}" [${enr.orgUnit}]`,
                    `event: id=${event.event} orgUnit="${event.orgUnitName}" [${event.orgUnit}]`,
                ];

                return msg.join(" - ");
            })
            .join("\n");
    }

    private getMismatchRecords(trackedEntities: D2TrackerTrackedEntity[]): MismatchRecord[] {
        return _(trackedEntities)
            .flatMap(trackedEntity => {
                return _(trackedEntity.enrollments)
                    .flatMap(enrollment => {
                        return enrollment.events.map(event => {
                            if (event.orgUnit !== enrollment.orgUnit) {
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

    private async getTrackedEntities(options: {
        program: NamedRef;
        page: number;
        post: boolean;
        pageCount: number;
    }): Promise<D2TrackerTrackedEntity[]> {
        logger.info(`Get events: page ${options.page} of ${options.pageCount}`);

        const response = await this.api.tracker.trackedEntities
            .get({
                ...params,
                page: options.page,
                pageSize: this.pageSize,
                program: options.program.id,
            })
            .getData();

        logger.info(`Tracked entities: ${response.instances.length}`);

        return response.instances;
    }
}

const params = {
    ouMode: "ALL",
    fields: {
        trackedEntity: true,
        orgUnit: true,
        orgUnitName: true,
        enrollments: {
            enrollment: true,
            orgUnit: true,
            orgUnitName: true,
            events: {
                event: true,
                orgUnit: true,
                orgUnitName: true,
            },
        },
    },
} as const;

type D2TrackerTrackedEntity = SelectedPick<D2TrackerTrackedEntitySchema, typeof params["fields"]>;
type D2TrackerEnrollment = D2TrackerTrackedEntity["enrollments"][number];
type D2TrackerEvent = D2TrackerEnrollment["events"][number];
type D2TrackerToSave = SelectedPick<D2TrackerEventSchema, { $all: true }>;

type T1 = D2TrackerToSave["geometry"];

type MismatchRecord = {
    trackedEntity: D2TrackerTrackedEntity;
    enrollment: D2TrackerEnrollment;
    event: D2TrackerEvent;
};

type Report = { contents: string; events: number };

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
