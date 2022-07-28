import { Id } from "./Base";
import _ from "lodash";
import { Timestamp } from "./Date";

export interface ProgramEvent {
    id: Id;
    programId: Id;
    orgUnitId: Id;
    programStageId: Id;
    dataValues: EventDataValue[];
    trackedEntityInstanceId?: Id;
    created: Timestamp;
}

export interface EventDataValue {
    dataElementId: Id;
    value: string;
}

export class DuplicatedProgramEvents {
    constructor(private options: { ignoreDataElementsIds?: Id[] }) {}

    get(events: ProgramEvent[]): ProgramEvent[] {
        return _(events)
            .groupBy(event =>
                _.compact([
                    event.orgUnitId,
                    event.programId,
                    event.programStageId,
                    event.trackedEntityInstanceId,
                ]).join(".")
            )
            .values()
            .flatMap(events => this.excludeDuplicatedEventsForGroup(events))
            .value();
    }

    private excludeDuplicatedEventsForGroup(eventsGroup: ProgramEvent[]): ProgramEvent[] {
        const getOldestEvent = (events: ProgramEvent[]) => _.first(_.sortBy(events, ev => ev.created));

        return _(eventsGroup)
            .groupBy(event => this.getEventDataValuesUid(event))
            .values()
            .filter(events => events.length > 1)
            .map(getOldestEvent)
            .compact()
            .value();
    }

    private getEventDataValuesUid(event: ProgramEvent) {
        const { ignoreDataElementsIds } = this.options;

        return _(event.dataValues)
            .sortBy(dv => dv.dataElementId)
            .reject(dv => (ignoreDataElementsIds ? ignoreDataElementsIds.includes(dv.dataElementId) : false))
            .map(dv => [dv.dataElementId, dv.value].join("."))
            .join();
    }
}
