import { Id, NamedRef, Ref, Username } from "./Base";
import _ from "lodash";
import { Timestamp } from "./Date";
import { Maybe } from "utils/ts-utils";

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
    dueDate: Timestamp;
}

export interface ProgramEventToSave {
    id: Id;
    program: Ref;
    orgUnit: Ref;
    programStage: Ref;
    dataValues: EventDataValue[];
    trackedEntityInstanceId?: Id;
    status: EventStatus;
    date: Timestamp;
    dueDate: Timestamp;
}

type EventStatus = "ACTIVE" | "COMPLETED" | "VISITED" | "SCHEDULED" | "OVERDUE" | "SKIPPED";

export interface EventDataValue {
    dataElementId: Id;
    value: string;
    storedBy: Username;
}

export class DuplicatedProgramEvents {
    constructor(
        private options: { ignoreDataElementsIds: Maybe<Id[]>; checkDataElementsIds?: Maybe<Id[]> }
    ) {}

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
        const { ignoreDataElementsIds, checkDataElementsIds } = this.options;

        return _(event.dataValues)
            .sortBy(dv => dv.dataElementId)
            .filter(dv => (checkDataElementsIds ? checkDataElementsIds.includes(dv.dataElementId) : true))
            .reject(dv => (ignoreDataElementsIds ? ignoreDataElementsIds.includes(dv.dataElementId) : false))
            .map(dv => [dv.dataElementId, dv.value].join("."))
            .join();
    }
}
