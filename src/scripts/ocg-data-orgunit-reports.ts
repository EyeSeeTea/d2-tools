import _ from "lodash";
import { command, option, run, string } from "cmd-ts";
import { getId, Id, Ref } from "domain/entities/Base";
import { getApiUrlOptions, getD2ApiFromArgs } from "scripts/common";
import { D2Api } from "types/d2-api";
import { assert } from "utils/ts-utils";
import { DataReport_, ExportDataUseCase } from "domain/usecases/ExportDataUseCase";
import { DataValuesD2Repository } from "data/DataValuesD2Repository";
import { OrgUnitD2Repository } from "data/OrgUnitD2Repository";
import { OrgUnit } from "domain/entities/OrgUnit";

const cmd = command({
    name: "export",
    description: "Generate report for aggregated and programs data",
    args: {
        ...getApiUrlOptions(),
        orgUnitId: option({
            type: string,
            long: "orgunit-id",
            description: "Parent orgunit ID",
        }),
    },
    handler: async args => {
        const api = getD2ApiFromArgs(args);
        const dataValueRepository = new DataValuesD2Repository(api);
        const orgUnitRepository = new OrgUnitD2Repository(api);
        const report = await new ExportDataUseCase(api, dataValueRepository, orgUnitRepository).execute({
            parentOrgUnitId: args.orgUnitId,
        });
        await new DataReport(api, report, args).execute();
    },
});

class DataReport {
    orgUnitId: string;
    orgUnitsById: Record<Id, OrgUnit>;

    constructor(private api: D2Api, private report: DataReport_, options: { orgUnitId: string }) {
        this.orgUnitId = options.orgUnitId;
        this.orgUnitsById = _.keyBy(this.report.orgUnits, getId);
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

    private getOrgUnitName(orgUnitId: string): string {
        const orgUnit = this.orgUnitsById[orgUnitId];
        return orgUnit?.name || "-";
    }

    private async getDataValuesReport(): Promise<string[]> {
        const report = _(this.report.dataValues)
            .groupBy(dv => `${this.getOrgUnitName(dv.orgUnit)} [${dv.orgUnit}]`)
            .toPairs()
            .sortBy(([orgUnitName, _dataValues]) => orgUnitName)
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

    private async getEventsReport(): Promise<string[]> {
        const events = this.report.nonTrackerEvents;

        const report = _(events)
            .groupBy(ev => this.toKey(ev.program, ev.programName))
            .toPairs()
            .flatMap(([programKey, events]) => {
                const [programId, programName] = this.fromKey(programKey);
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

    private async getTrackerDataReport(): Promise<string[]> {
        const trackedEntities = this.report.trackedEntities;

        const report = _(trackedEntities)
            .flatMap(ev => ev.enrollments)
            .groupBy(enrollment => this.toKey(enrollment.program, enrollment.programName))
            .toPairs()
            .flatMap(([programKey, enrollments]) => {
                const [programId, programName] = this.fromKey(programKey);

                const enrollmentsByOrgUnit = _(enrollments)
                    .groupBy(enrollment => this.toKey(enrollment.orgUnit, enrollment.orgUnitName))
                    .toPairs()
                    .map(([orgUnitKey, enrollments]) => {
                        const [orgUnitId, orgUnitName] = this.fromKey(orgUnitKey);
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

    private toKey(id: string, name: string): string {
        return [id, name].join("-");
    }

    private fromKey(key: string): [string, string] {
        const parts = key.split("-");
        const id = parts[0];
        const name = parts.slice(1).join("-");
        return [assert(id), name];
    }
}

const args = process.argv.slice(2);
run(cmd, args);
