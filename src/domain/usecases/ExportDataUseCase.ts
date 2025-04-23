import _ from "lodash";
import { Async } from "domain/entities/Async";
import { getId, Id, Ref } from "domain/entities/Base";
import { D2Api } from "types/d2-api";
import { assert } from "utils/ts-utils";
import logger from "utils/log";
import { promiseMap, runMetadata } from "data/dhis2-utils";
import { getUid } from "data/dhis2";
import { DataValuesRepository } from "domain/repositories/DataValuesRepository";
import { OrgUnitRepository } from "domain/repositories/OrgUnitRepository";
import { OrgUnit } from "domain/entities/OrgUnit";

export class ExportDataUseCase {
    constructor(
        private api: D2Api,
        private dataValueRepository: DataValuesRepository,
        private orgUnitRepository: OrgUnitRepository
    ) {}

    async execute(options: { parentOrgUnitId: Id }): Async<DataReport_> {
        const report = new DataReport(this.api, { orgUnitId: options.parentOrgUnitId });

        const dataValues = await this.dataValueRepository.get({
            orgUnitIds: [options.parentOrgUnitId],
            children: true,
            startDate: "1900",
            endDate: (new Date().getFullYear() + 100).toString(),
            allDataElements: true,
        });

        const orgUnitIds = _(dataValues)
            .map(dv => dv.orgUnit)
            .uniq()
            .value();

        const orgUnits = await this.orgUnitRepository.getByIdentifiables(orgUnitIds);

        const trackedEntities = await report.getTrackedEntities();

        return {
            dataValues: dataValues,
            orgUnits: orgUnits,
            nonTrackerEvents: await report.getEventsForNonTrackerPrograms(),
            trackedEntities: trackedEntities,
        };
    }
}

export type DataReport_ = {
    dataValues: DataValue[];
    orgUnits: OrgUnit[];
    nonTrackerEvents: Event_[];
    trackedEntities: Tei[];
};

type DataValue = {
    dataElement: string;
    period: string;
    orgUnit: string;
    value: string;
    storedBy: string;
    lastUpdated: string;
    created: string;
};

type Event_ = {
    programName: string;
    program: string;
    orgUnit: string;
    orgUnitName: string;
};

type Tei = {
    enrollments: Array<{
        programName: string;
        orgUnit: string;
        program: string;
        events: { event: string }[];
        orgUnitName: string;
    }>;
    trackedEntity: string;
};

class DataReport {
    orgUnitId: string;

    constructor(private api: D2Api, options: { orgUnitId: string }) {
        this.orgUnitId = options.orgUnitId;
    }

    private getD2CaptureUrl(options: { programId: string; orgUnitId: string }) {
        return (
            `${this.api.baseUrl}/dhis-web-capture/index.html#/?` +
            `programId=${options.programId}&orgUnitId=${options.orgUnitId}`
        );
    }

    async getEventsForNonTrackerPrograms(): Promise<Event_[]> {
        const d2Events = await this.getD2EventsForNonTrackerPrograms();

        const programIds = _(d2Events)
            .map(ev => ev.program)
            .uniq()
            .value();

        const { programs } = await this.api.metadata
            .get({
                programs: {
                    fields: { id: true, name: true },
                    filter: { id: { in: programIds } },
                },
            })
            .getData();

        const programsById = _.keyBy(programs, getId);

        return d2Events.map(ev => ({
            ...ev,
            programName: assert(programsById[ev.program]).name,
        }));
    }

    private async getD2EventsForNonTrackerPrograms() {
        logger.info(`Get events for org units (with children): ${this.orgUnitId}`);

        const { instances: allEvents } = await this.api.tracker.events
            .get({
                orgUnit: this.orgUnitId,
                ouMode: "DESCENDANTS",
                fields: {
                    program: true,
                    orgUnit: true,
                    orgUnitName: true,
                    trackedEntity: true,
                },
            })
            .getData();

        const events = _(allEvents)
            .reject(ev => Boolean(ev.trackedEntity))
            .value();

        logger.info(`Events: ${events.length}`);

        return events;
    }

    async getTrackedEntities(): Promise<Tei[]> {
        logger.info(`Get tracker data for org units (with children): ${this.orgUnitId}`);

        const { programs, trackedEntityTypes } = await this.api.metadata
            .get({
                programs: {
                    fields: { id: true, name: true },
                },
                trackedEntityTypes: {
                    fields: { id: true },
                },
            })
            .getData();

        const trackedEntities = _.flatten(
            await promiseMap(trackedEntityTypes, async trackedEntityType => {
                const { instances: trackedEntities } = await this.api.tracker.trackedEntities
                    .get({
                        orgUnit: this.orgUnitId,
                        ouMode: "DESCENDANTS",
                        program: "", // Required by the API, but it can be empty as we pass the entity type
                        trackedEntityType: trackedEntityType.id,
                        fields: {
                            trackedEntity: true,
                            enrollments: {
                                orgUnit: true,
                                orgUnitName: true,
                                program: true,
                                events: { event: true },
                            },
                        },
                    })
                    .getData();

                return trackedEntities;
            })
        );

        const programsById = _.keyBy(programs, getId);
        logger.info(`Tracked entities: ${trackedEntities.length}`);

        return trackedEntities.map(trackedEntity => {
            return {
                ...trackedEntity,
                enrollments: (trackedEntity.enrollments || []).map(enrollment => {
                    return {
                        ...enrollment,
                        programName: assert(programsById[enrollment.program]).name,
                    };
                }),
            };
        });
    }
}
