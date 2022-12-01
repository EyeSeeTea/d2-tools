import {
    D2DataElement,
    D2ProgramRuleAction,
    D2ProgramRuleVariable,
    D2TrackedEntityAttribute,
} from "@eyeseetea/d2-api/2.36";
import { EventStatus } from "@eyeseetea/d2-api/api/events";

export type Id = string;

export interface UserDetails {
    id: Id;
    displayName: string;
    name: string;
    username: string;
}

export interface Constant {
    id: Id;
    displayName: string;
    value: number;
}

type IdMap<T> = Record<Id, T>;

type Expression = string;

export interface User {
    id: Id;
    lastUpdatedBy: UserDetails;
    createdBy: UserDetails;
    user: UserDetails;
    lastUpdated: Date;

    condition: Expression;
    displayName: string;
    programId: Id;
    programRuleActions: ProgramRuleAction[];
}

export interface ProgramRuleAction {
    id: string;
    content?: string;
    displayContent?: string;
    data?: Expression;
    location?: string;
    programRuleActionType: D2ProgramRuleAction["programRuleActionType"];
    dataElementId?: Id;
    programStageId?: Id;
    programStageSectionId?: Id;
    trackedEntityAttributeId?: Id;
    optionGroupId?: Id;
    optionId?: Id;
    style?: object;
}

export interface OrgUnit extends IdNameCode {
    groups: IdNameCode[];
}

export interface IdNameCode {
    id: Id;
    name: string;
    code: string;
}

export interface ProgramRuleVariable {
    id: Id;
    displayName: string;
    programRuleVariableSourceType: D2ProgramRuleVariable["programRuleVariableSourceType"];
    // valueType is present in capture-app type. This field was added on 2.38, and its value
    // depends on the source type: dataElement, TEA, or Calculated Value.
    valueType: string;
    programId: Id;
    dataElementId?: Id;
    trackedEntityAttributeId?: Id;
    programStageId?: Id;
    useNameForOptionSet?: boolean;
}

type StringDateTime = string;

export interface Enrollment {
    enrolledAt?: StringDateTime;
    occurredAt?: StringDateTime;
    enrollmentId?: StringDateTime;
}

type DataElementId = Id;

export type TrackedEntityAttributeValuesMap = Record<DataElementId, string>;

export type ProgramRuleEvent = ProgramRuleEventObj; // & Record<DataElementId, string>;

export interface ProgramRuleEventObj {
    eventId: Id;
    programId?: Id;
    programStageId?: Id;
    orgUnitId: Id;
    orgUnitName: string;
    trackedEntityInstanceId?: Id | undefined;
    enrollmentId?: Id;
    enrollmentStatus?: "ACTIVE" | "COMPLETED" | "CANCELLED";
    status?: EventStatus;
    eventDate?: StringDateTime;
    occurredAt?: StringDateTime;
    scheduledAt?: StringDateTime;
}
