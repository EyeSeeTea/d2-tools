import { Id } from "./Base";
import _ from "lodash";

export interface ProgramEvent {
    id: Id;
    programId: Id;
    orgUnitId: Id;
    programStageId: Id;
    dataValues: EventDataValue[];
    trackedEntityInstanceId?: Id;
}

export interface EventDataValue {
    dataElementId: Id;
    value: string;
}

export class DuplicatedProgramEvents {
    get(events: ProgramEvent[]): ProgramEvent[] {
        return _(events)
            .groupBy(event =>
                _.compact([
                    // Consider enrollment?
                    event.orgUnitId,
                    event.programId,
                    event.programStageId,
                    event.trackedEntityInstanceId,
                ]).join(".")
            )
            .values()
            .flatMap(events => this.getForGrouped(events))
            .value();
    }

    private getForGrouped(eventsGrouped: ProgramEvent[]): ProgramEvent[] {
        const getDataValues = (ev: ProgramEvent) => _(ev.dataValues).sortBy(dv => dv.dataElementId);
        return _.uniqWith(eventsGrouped, (ev1, ev2) => _.isEqual(getDataValues(ev1), getDataValues(ev2)));
    }
}
