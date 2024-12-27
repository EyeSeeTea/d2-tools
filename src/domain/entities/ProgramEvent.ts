import { Id, NamedRef, Ref, Username } from "./Base";
import _ from "lodash";
import { Timestamp } from "./Date";
import { Maybe } from "utils/ts-utils";

export interface ProgramEvent {
    id: Id;
    program: NamedRef & { type: "event" | "tracker" };
    orgUnit: NamedRef;
    programStage: NamedRef;
    dataValues: EventDataValue[];
    trackedEntityInstanceId?: Id;
    created: Timestamp;
    lastUpdated: Timestamp;
    status: EventStatus;
    date: Timestamp;
    dueDate: Timestamp;
}

export interface ProgramEventToSave {
    id: Id;
    program: Ref;
    orgUnit: Ref;
    programStage: Ref;
    dataValues: Array<{ dataElement: Ref; value: string }>;
    trackedEntityInstanceId?: Id;
    status: EventStatus;
    date: Timestamp;
    dueDate: Timestamp;
}

type EventStatus = "ACTIVE" | "COMPLETED" | "VISITED" | "SCHEDULED" | "OVERDUE" | "SKIPPED";

export const orgUnitModes = ["SELECTED", "CHILDREN", "DESCENDANTS"] as const;

export type OrgUnitMode = typeof orgUnitModes[number];

export interface EventDataValue {
    dataElement: NamedRef;
    value: string;
    storedBy: Username;
    oldValue?: string;
    providedElsewhere?: boolean;
    lastUpdated: Timestamp;
}

export type DuplicatedEvents = { groups: EventsGroup[] };

export type EventsGroup = { events: ProgramEvent[] };

export class DuplicatedProgramEvents {
    constructor(
        private options: { ignoreDataElementsIds: Maybe<Id[]>; checkDataElementsIds?: Maybe<Id[]> }
    ) {}

    get(events: ProgramEvent[]): DuplicatedEvents {
        const groups = _(events)
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

        return { groups: groups };
    }

    private getDuplicatedEventsForGroup(eventsGroup: ProgramEvent[]): EventsGroup[] {
        return _(eventsGroup)
            .groupBy(event => this.getEventDataValuesHash(event))
            .values()
            .filter(events => events.length > 1)
            .map(events => ({ events: _.sortBy(events, ev => ev.created) }))
            .compact()
            .value();
    }

    private getEventDataValuesHash(event: ProgramEvent) {
        const { ignoreDataElementsIds, checkDataElementsIds } = this.options;

        return _(event.dataValues)
            .sortBy(dv => dv.dataElement.id)
            .filter(dv => (checkDataElementsIds ? checkDataElementsIds.includes(dv.dataElement.id) : true))
            .reject(dv => (ignoreDataElementsIds ? ignoreDataElementsIds.includes(dv.dataElement.id) : false))
            .map(dv => [dv.dataElement.id, dv.value].join("="))
            .join();
    }
}
