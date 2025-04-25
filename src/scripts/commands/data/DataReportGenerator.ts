import _ from "lodash";
import { getId, Id } from "domain/entities/Base";
import { assert } from "utils/ts-utils";
import { OrgUnit } from "domain/entities/OrgUnit";
import { Program } from "domain/entities/Program";
import { DataReport } from "domain/entities/DataReport";

export class DataReportGenerator {
    orgUnitId: string;
    orgUnitsById: Record<Id, OrgUnit>;
    programsById: Record<Id, Program>;

    constructor(private report: DataReport, options: { orgUnitId: string }) {
        this.orgUnitId = options.orgUnitId;
        this.orgUnitsById = _.keyBy(this.report.orgUnits, getId);
        this.programsById = _.keyBy(this.report.programs, getId);
    }

    async execute() {
        const report = _.concat(
            await this.getDataValuesReport(),
            "",
            await this.getEventsReport(),
            "",
            await this.getTrackerDataReport()
        );

        console.info(report.join("\n"));
    }

    private getOrgUnitName(orgUnitId: string): string {
        const orgUnit = this.orgUnitsById[orgUnitId];
        return orgUnit?.name || "-";
    }

    private getProgramName(programId: string): string {
        const program = this.programsById[programId];
        return program?.name || "-";
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

        return [`Data Values: ${this.report.dataValuesAppUrl}`, ...report.map(s => "  " + s).value()];
    }

    private async getEventsReport(): Promise<string[]> {
        const events = this.report.nonTrackerEvents;

        const report = _(events)
            .groupBy(ev => this.toKey(ev.program, this.getProgramName(ev.program)))
            .toPairs()
            .flatMap(([programKey, events]) => {
                const [programId, programName] = this.fromKey(programKey);
                const eventsByOrgUnit = _(events)
                    .groupBy(ev => ev.orgUnit)
                    .toPairs()
                    .map(([orgUnitId, events]) => ({
                        events: events,
                        orgUnitId: orgUnitId,
                        orgUnitName: this.getOrgUnitName(orgUnitId),
                    }))
                    .sortBy(obj => obj.orgUnitName)
                    .value();

                return [
                    `${programName}: ${events.length} events`,
                    ...eventsByOrgUnit.map(obj => {
                        return (
                            `  ${obj.orgUnitName} (${obj.events.length} events): ` +
                            this.report.programDataAppUrl({ programId: programId, orgUnitId: obj.orgUnitId })
                        );
                    }),
                ];
            });

        return [`Events data [event programs only]:`, ...report.value()];
    }

    private async getTrackerDataReport(): Promise<string[]> {
        const trackedEntities = this.report.trackedEntities;

        const report = _(trackedEntities)
            .flatMap(ev => ev.enrollments)
            .groupBy(enrollment =>
                this.toKey(enrollment.programId, this.getProgramName(enrollment.programId))
            )
            .toPairs()
            .flatMap(([programKey, enrollments]) => {
                const [programId, programName] = this.fromKey(programKey);

                const enrollmentsByOrgUnit = _(enrollments)
                    .groupBy(enrollment => {
                        const orgUnitId = enrollment.orgUnit.id;
                        return this.toKey(orgUnitId, this.getOrgUnitName(orgUnitId));
                    })
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
                            this.report.programDataAppUrl({ programId: programId, orgUnitId: obj.orgUnitId })
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
