import _ from "lodash";
import { Async } from "domain/entities/Async";
import { getId, Id } from "domain/entities/Base";
import { promiseMap } from "data/dhis2-utils";
import { DataValuesRepository } from "domain/repositories/DataValuesRepository";
import { OrgUnitRepository } from "domain/repositories/OrgUnitRepository";
import { EventsRepository } from "domain/repositories/enrollments/EventsRepository";
import { ProgramsRepository } from "domain/repositories/ProgramsRepository";
import { TrackedEntityRepository } from "domain/repositories/TrackedEntityRepository";
import { DataReport } from "../entities/DataReport";
import { DataValue } from "domain/entities/DataValue";
import { Event } from "domain/entities/enrollments/Event";
import { Program } from "domain/entities/Program";

export class GetDataReportUseCase {
    constructor(
        private orgUnitRepository: OrgUnitRepository,
        private programRepository: ProgramsRepository,
        private dataValueRepository: DataValuesRepository,
        private eventRepository: EventsRepository,
        private trackedEntitiesRepository: TrackedEntityRepository
    ) {}

    async execute(options: { parentOrgUnitId: Id }): Async<DataReport> {
        const dataValues = await this.getDataValues(options);
        const programs = await this.programRepository.get({});
        const nonTrackerEvents = await this.getNonTrackerEvents(programs, options);

        return {
            dataValues: dataValues,
            dataValuesAppUrl: this.dataValueRepository.getAppUrl(),
            orgUnits: await this.getOrgUnits(dataValues, nonTrackerEvents),
            programs: programs,
            nonTrackerEvents: nonTrackerEvents,
            trackedEntities: await this.getTrackedEntities(programs, options),
            programDataAppUrl: options => this.programRepository.getAppUrl(options),
        };
    }

    private async getOrgUnits(dataValues: DataValue[], nonTrackerEvents: Event[]) {
        const orgUnitFromDataValuesIds = dataValues.map(dv => dv.orgUnit);
        const orgUnitFromEventsIds = nonTrackerEvents.map(ev => ev.orgUnit);
        const orgUnitIds = _(orgUnitFromDataValuesIds).concat(orgUnitFromEventsIds).uniq().value();
        const orgUnits = await this.orgUnitRepository.getByIdentifiables(orgUnitIds);
        return orgUnits;
    }

    private async getTrackedEntities(programs: Program[], options: { parentOrgUnitId: Id }) {
        const trackerProgramIds = _(programs)
            .filter(program => program.programType === "WITH_REGISTRATION")
            .map(getId)
            .value();

        const trackedEntities = _.flatten(
            await promiseMap(trackerProgramIds, programId =>
                this.trackedEntitiesRepository.getAll({
                    programId: programId,
                    orgUnitIds: [options.parentOrgUnitId],
                    children: true,
                })
            )
        );
        return trackedEntities;
    }

    private async getNonTrackerEvents(programs: Program[], options: { parentOrgUnitId: Id }) {
        const nonTrackerProgramIds = _(programs)
            .filter(program => program.programType === "WITHOUT_REGISTRATION")
            .map(getId)
            .value();

        const nonTrackerEvents = _.flatten(
            await promiseMap(nonTrackerProgramIds, programId =>
                this.eventRepository.getAll({
                    orgUnitId: options.parentOrgUnitId,
                    programId: programId,
                    children: true,
                })
            )
        );
        return nonTrackerEvents;
    }

    private async getDataValues(options: { parentOrgUnitId: Id }) {
        return await this.dataValueRepository.get({
            orgUnitIds: [options.parentOrgUnitId],
            children: true,
            startDate: "1900",
            endDate: (new Date().getFullYear() + 100).toString(),
            allDataElements: true,
        });
    }
}
