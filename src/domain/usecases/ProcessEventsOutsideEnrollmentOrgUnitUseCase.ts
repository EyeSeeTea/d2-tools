import _ from "lodash";
import { promiseMap } from "data/dhis2-utils";
import { Id, NamedRef } from "domain/entities/Base";
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
        logger.info(`Processing program: ${options.program.name}`);

        const pageCount = await this.getPageCount(options);

        await promiseMap(_.range(1, pageCount + 1), async page => {
            await this.fixEventsInProgramAndPage({ ...options, page: page });
        });
    }

    private async getPageCount(options: { program: NamedRef; post: boolean }) {
        const res = await this.api.tracker.trackedEntities
            .get({
                ...params,
                page: 1,
                pageSize: 0,
                totalPages: true,
                program: options.program.id,
            })
            .getData();

        const pageCount = Math.ceil((res.total || 0) / this.pageSize);

        logger.debug(`Total pages: ${pageCount}`);
        return pageCount;
    }

    async fixEventsInProgramAndPage(options: { program: NamedRef; page: number; post: boolean }) {
        const trackedEntities = await this.getTrackedEntities(options);
        const mismatchRecords = this.getMismatchRecords(trackedEntities);

        if (mismatchRecords.length === 0) {
            logger.debug(`No events outside its enrollment orgUnit`);
            return;
        }

        const report = this.getReport(mismatchRecords);
        console.log(report);

        const eventIds = mismatchRecords.map(obj => obj.event.event);
        const wrongByEventId = _.keyBy(mismatchRecords, obj => obj.event.event);

        if (mismatchRecords.length === 0) {
            return;
        } else if (!options.post) {
            logger.info(`Add --post to update events (${mismatchRecords.length})`);
            return;
        } else {
            logger.info(`Get events to update: ${eventIds.join(",")}`);
            const { instances: events } = await this.api.tracker.events
                .get({
                    fields: { $all: true },
                    event: eventIds.join(";"),
                })
                .getData();

            const fixedEvents = events.map((event): typeof event => {
                const obj = wrongByEventId[event.event];
                if (!obj) throw new Error(`Event not found: ${event.event}`);
                return { ...event, orgUnit: obj.enrollment.orgUnit };
            });

            await this.saveEvents(fixedEvents);
        }
    }

    private async saveEvents(fixedEvents: D2TrackerEvent[]) {
        logger.info(`Post events: ${fixedEvents.length}`);

        const res2 = await this.api.tracker
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

        logger.info(`Post result: ${JSON.stringify(res2.stats)}`);
    }

    private getReport(mismatchRecords: MismatchRecord[]): string {
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

    private getMismatchRecords(trackedEntities: D2TrackerTrackedEntity[]) {
        const wrong = _(trackedEntities)
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

        logger.info(`Events outside its enrollment orgUnit: ${wrong.length}`);
        return wrong;
    }

    private async getTrackedEntities(options: {
        program: NamedRef;
        page: number;
        post: boolean;
    }): Promise<D2TrackerTrackedEntity[]> {
        logger.debug(`Get events - page ${options.page}`);

        const res = await this.api.tracker.trackedEntities
            .get({
                ...params,
                page: options.page,
                pageSize: this.pageSize,
                program: options.program.id,
            })
            .getData();

        logger.info(`Tracked entities: ${res.instances.length}`);
        return res.instances;
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
