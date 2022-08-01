import { Id, NamedRef } from "./Base";
import _ from "lodash";
import { Timestamp } from "./Date";

export interface ProgramEvent {
    id: Id;
    program: NamedRef;
    orgUnit: NamedRef;
    programStage: NamedRef;
    dataValues: EventDataValue[];
    trackedEntityInstanceId?: Id;
    created: Timestamp;
    status: EventStatus;
    date: Timestamp;
}

type EventStatus = "ACTIVE" | "COMPLETED" | "VISITED" | "SCHEDULED" | "OVERDUE" | "SKIPPED";

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
                    event.orgUnit.id,
                    event.program.id,
                    event.programStage.id,
                    event.trackedEntityInstanceId,
                ]).join(".")
            )
            .values()
            .flatMap(events => this.getDuplicatedEventsForGroup(events))
            .value();
    }

    private getDuplicatedEventsForGroup(eventsGroup: ProgramEvent[]): ProgramEvent[] {
        const excludeOldestEvent = (events: ProgramEvent[]) =>
            _(events)
                .sortBy(ev => ev.created)
                .drop(1)
                .value();

        return _(eventsGroup)
            .groupBy(event => this.getEventDataValuesUid(event))
            .values()
            .filter(events => events.length > 1)
            .flatMap(excludeOldestEvent)
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
