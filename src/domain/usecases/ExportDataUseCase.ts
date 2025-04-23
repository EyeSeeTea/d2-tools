import _ from "lodash";
import { Async } from "domain/entities/Async";
import { getId, Id } from "domain/entities/Base";
import { promiseMap } from "data/dhis2-utils";
import { DataValuesRepository } from "domain/repositories/DataValuesRepository";
import { OrgUnitRepository } from "domain/repositories/OrgUnitRepository";
import { OrgUnit } from "domain/entities/OrgUnit";
import { EventsRepository } from "domain/repositories/enrollments/EventsRepository";
import { ProgramsRepository } from "domain/repositories/ProgramsRepository";
import { Program } from "domain/entities/Program";
import { TrackedEntityRepository } from "domain/repositories/TrackedEntityRepository";
import { TrackedEntity } from "domain/entities/TrackedEntity";
import { DataValue } from "domain/entities/DataValue";
import { Event } from "domain/entities/enrollments/Event";

export class ExportDataUseCase {
    constructor(
        private orgUnitRepository: OrgUnitRepository,
        private programRepository: ProgramsRepository,
        private dataValueRepository: DataValuesRepository,
        private eventRepository: EventsRepository,
        private trackedEntitiesRepository: TrackedEntityRepository
    ) {}

    async execute(options: { parentOrgUnitId: Id }): Async<DataReport_> {
        const dataValues = await this.dataValueRepository.get({
            orgUnitIds: [options.parentOrgUnitId],
            children: true,
            startDate: "1900",
            endDate: (new Date().getFullYear() + 100).toString(),
            allDataElements: true,
        });

        const programs = await this.programRepository.get({});
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
        const orgUnitFromDataValuesIds = dataValues.map(dv => dv.orgUnit);
        const orgUnitFromEventsIds = nonTrackerEvents.map(ev => ev.orgUnit);
        const orgUnitIds = _(orgUnitFromDataValuesIds).concat(orgUnitFromEventsIds).uniq().value();
        const orgUnits = await this.orgUnitRepository.getByIdentifiables(orgUnitIds);

        return {
            dataValues: dataValues,
            orgUnits: orgUnits,
            programs: programs,
            nonTrackerEvents: nonTrackerEvents,
            trackedEntities: trackedEntities,
        };
    }
}

export type DataReport_ = {
    dataValues: DataValue[];
    orgUnits: OrgUnit[];
    programs: Program[];
    nonTrackerEvents: Event[];
    trackedEntities: TrackedEntity[];
};
