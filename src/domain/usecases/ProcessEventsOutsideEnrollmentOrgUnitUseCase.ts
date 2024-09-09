import _ from "lodash";
import { promiseMap } from "data/dhis2-utils";
import { NamedRef } from "domain/entities/Base";
import { D2Api } from "types/d2-api";
import logger from "utils/log";
import { D2TrackerTrackedEntity } from "@eyeseetea/d2-api/api/trackerTrackedEntities";
import { D2TrackerEnrollment } from "@eyeseetea/d2-api/api/trackerEnrollments";
import { D2TrackerEvent } from "@eyeseetea/d2-api/api/trackerEvents";
import { ProgramsRepository } from "domain/repositories/ProgramsRepository";

export class DetectExternalOrgUnitUseCase {
    pageSize = 1000;

    constructor(private api: D2Api, private programRepository: ProgramsRepository) {}

    async execute(options: { post: boolean }) {
        const programs = await this.getPrograms();

        await promiseMap(programs, async program => {
            await this.fixEventsInProgram({ program: program, post: options.post });
        });
    }

    private async getPrograms() {
        logger.info(`Get tracker programs`);
        const programs = await this.programRepository.get({ programTypes: ["WITH_REGISTRATION"] });
        logger.info(`Total tracker programs: ${programs.length}`);
        return programs;
    }

    async fixEventsInProgram(options: { program: NamedRef; post: boolean }) {
        const pageCount = await this.getPageCount(options);

        await promiseMap(_.range(1, pageCount + 1), async page => {
            await this.fixEventsForPage({ ...options, page: page, pageCount: pageCount });
        });
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

    async fixEventsForPage(options: { program: NamedRef; page: number; pageCount: number; post: boolean }) {
        const trackedEntities = await this.getTrackedEntities(options);
        const mismatchRecords = this.getMismatchRecords(trackedEntities);
        const report = this.buildReport(mismatchRecords);
        logger.info(`Events outside its enrollment orgUnit: ${mismatchRecords.length}`);
        console.log(report);

        if (_(mismatchRecords).isEmpty()) {
            logger.debug(`No events outside its enrollment orgUnit`);
        } else if (!options.post) {
            logger.info(`Add --post to update events (${mismatchRecords.length})`);
        } else {
            await this.fixMismatchEvents(mismatchRecords);
        }
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

    private async saveEvents(fixedEvents: D2TrackerEvent[]) {
        logger.info(`Post events: ${fixedEvents.length}`);

        const response = await this.api.tracker
            .post(
                {
                    async: false,
                    skipPatternValidation: true,
                    skipSideEffects: true,
                    skipRuleEngine: true,
                    importMode: "COMMIT",
                },
                { events: fixedEvents }
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

type MismatchRecord = {
    trackedEntity: D2TrackerTrackedEntity;
    enrollment: D2TrackerEnrollment;
    event: D2TrackerEvent;
};

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
