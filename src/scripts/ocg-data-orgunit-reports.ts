import _ from "lodash";
import { command, option, run, string } from "cmd-ts";
import { getUid } from "data/dhis2";
import { promiseMap, runMetadata } from "data/dhis2-utils";
import { getId, Ref } from "domain/entities/Base";
import { getApiUrlOptions, getD2ApiFromArgs } from "scripts/common";
import { D2Api } from "types/d2-api";
import logger from "utils/log";
import { assert } from "utils/ts-utils";

const cmd = command({
    name: "export",
    description: "Export program metadata and data (events, enrollments, TEIs)",
    args: {
        ...getApiUrlOptions(),
        orgUnitId: option({
            type: string,
            long: "orgunits-ids",
            description: "List of organisation units (comma-separated)",
        }),
    },
    handler: async args => {
        const api = getD2ApiFromArgs(args);
        await new DataReport(api, args).execute();
    },
});

class DataReport {
    orgUnitId: string;

    constructor(private api: D2Api, options: { orgUnitId: string }) {
        this.orgUnitId = options.orgUnitId;
    }

    async execute() {
        const report = _.concat(
            await this.getDataValuesReport(),
            "",
            await this.getEventsReport(),
            "",
            await this.getTrackerDataReport()
        );

        console.log(report.join("\n"));
    }

    private async getDataValuesReport(): Promise<string[]> {
        const dataValues = await this.getDataValues();

        const report = _(dataValues)
            .groupBy(dv => `${dv.orgUnitName} [${dv.orgUnit}]`)
            .toPairs()
            .map(([orgUnitName, dataValues]) => {
                const countsByPeriod = _(dataValues)
                    .groupBy(dataValues => dataValues.period)
                    .toPairs()
                    .map(([period, dataValues]) => ({ period, dataValues }))
                    .sortBy(obj => obj.period)
                    .map(obj => `${obj.period} (${obj.dataValues.length})`)
                    .value();

                return `${orgUnitName}: ${countsByPeriod.join(", ")}`;
            });

        return [
            `Data Values: ${this.getD2Url("/dhis-web-dataentry/index.action")}`,
            ...report.map(s => "  " + s).value(),
        ];
    }

    private getD2Url(path: string): string {
        return `${this.api.baseUrl}/${path}`;
    }

    private async getDataValues() {
        const dataElementGroup = await this.createGroupWithAllDataElements();
        const dataValuesBase = await this.getD2DataValues(dataElementGroup);

        const orgUnitIds = _(dataValuesBase)
            .map(dv => dv.orgUnit)
            .uniq()
            .value();

        const { organisationUnits } = await this.api.metadata
            .get({
                organisationUnits: {
                    fields: { id: true, name: true },
                    filter: { id: { in: orgUnitIds } },
                },
            })
            .getData();

        const orgUnitsById = _.keyBy(organisationUnits, getId);

        return dataValuesBase.map((dataValue): typeof dataValue & { orgUnitName: string } => {
            return {
                ...dataValue,
                orgUnitName: assert(orgUnitsById[dataValue.orgUnit]).name,
            };
        });
    }

    private async getD2DataValues(dataElementGroup: Ref) {
        logger.info(`Get data values for org units (with children): ${this.orgUnitId}`);

        const { dataValues } = await this.api.dataValues
            .getSet({
                dataElementGroup: [dataElementGroup.id],
                dataSet: [],
                startDate: "1900",
                endDate: (new Date().getFullYear() + 100).toString(),
                orgUnit: [this.orgUnitId],
                children: true,
            })
            .getData();

        logger.info(`Data values: ${dataValues.length}`);

        return dataValues;
    }

    private async getEventsReport(): Promise<string[]> {
        const events = await this.getEventsForNonTrackerPrograms();

        const report = _(events)
            .groupBy(ev => toKey(ev.program, ev.programName))
            .toPairs()
            .flatMap(([programKey, events]) => {
                const [programId, programName] = fromKey(programKey);
                const eventsByOrgUnit = _(events)
                    .groupBy(ev => ev.orgUnit)
                    .toPairs()
                    .map(([orgUnitId, events]) => ({
                        events: events,
                        orgUnitId: orgUnitId,
                        orgUnitName: assert(events[0]).orgUnitName,
                    }))
                    .sortBy(obj => obj.orgUnitName)
                    .value();

                return [
                    `${programName}: ${events.length} events`,
                    ...eventsByOrgUnit.map(obj => {
                        return (
                            `  ${obj.orgUnitName} (${obj.events.length} events): ` +
                            this.getD2CaptureUrl({ programId: assert(programId), orgUnitId: obj.orgUnitId })
                        );
                    }),
                ];
            });

        return [
            `Events data [event programs only]:`, //
            ...report.value(),
        ];
    }

    private getD2CaptureUrl(options: { programId: string; orgUnitId: string }) {
        return (
            `${this.api.baseUrl}/dhis-web-capture/index.html#/?` +
            `programId=${options.programId}&orgUnitId=${options.orgUnitId}`
        );
    }

    private async getEventsForNonTrackerPrograms() {
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

    private async getTrackerDataReport(): Promise<string[]> {
        const trackedEntities = await this.getTrackedEntities();

        const report = _(trackedEntities)
            .flatMap(ev => ev.enrollments)
            .groupBy(enrollment => toKey(enrollment.program, enrollment.programName))
            .toPairs()
            .flatMap(([programKey, enrollments]) => {
                const [programId, programName] = fromKey(programKey);

                const enrollmentsByOrgUnit = _(enrollments)
                    .groupBy(enrollment => toKey(enrollment.orgUnit, enrollment.orgUnitName))
                    .toPairs()
                    .map(([orgUnitKey, enrollments]) => {
                        const [orgUnitId, orgUnitName] = fromKey(orgUnitKey);
                        return { orgUnitId: orgUnitId, orgUnitName, enrollments };
                    })
                    .sortBy(obj => obj.orgUnitId)
                    .value();

                const eventsCount = _(enrollments)
                    .map(enrollment => enrollment.events.length)
                    .sum();

                // Tracker Capture does include the orgUnitId in the URL, so let's use
                // Capture App (which redirects to Tracker Capture when rows are clicked)
                return [
                    `${programName}: ${enrollments.length} enrollments (${eventsCount} events)`,
                    ...enrollmentsByOrgUnit.map(obj => {
                        return (
                            `  ${obj.orgUnitName} (${obj.enrollments.length} enrollments): ` +
                            this.getD2CaptureUrl({ programId: assert(programId), orgUnitId: obj.orgUnitId })
                        );
                    }),
                ];
            });

        return [`Tracker data:`, ...report.value()];
    }

    private async getTrackedEntities() {
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

        const trackedEntities0 = _.flatten(
            await promiseMap(trackedEntityTypes, async trackedEntityType => {
                const { instances: trackedEntities } = await this.api.tracker.trackedEntities
                    .get({
                        orgUnit: this.orgUnitId,
                        ouMode: "DESCENDANTS",
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
        logger.info(`Tracked entities: ${trackedEntities0.length}`);

        return trackedEntities0.map(trackedEntity => {
            return {
                ...trackedEntity,
                enrollments: trackedEntity.enrollments.map(enrollment => {
                    return {
                        ...enrollment,
                        programName: assert(programsById[enrollment.program]).name,
                    };
                }),
            };
        });
    }

    private async createGroupWithAllDataElements(): Promise<Ref> {
        logger.info(`Create temporal dataElementGroup containing all data elements`);

        const { dataElements } = await this.api.metadata
            .get({
                dataElements: {
                    fields: { id: true },
                },
            })
            .getData();

        const dataElementGroup = {
            id: getUid("dataElementGroup", "ALL"),
            name: "All data elements",
            dataElements: dataElements.map(de => ({ id: de.id })),
        };

        await runMetadata(
            this.api.metadata.post({
                dataElementGroups: [dataElementGroup],
            })
        );

        return dataElementGroup;
    }
}

function toKey(id: string, name: string): string {
    return [id, name].join("-");
}

function fromKey(key: string): [string, string] {
    const parts = key.split("-");
    const id = parts[0];
    const name = parts.slice(1).join("-");
    return [assert(id), name];
}

const args = process.argv.slice(2);
run(cmd, args);
