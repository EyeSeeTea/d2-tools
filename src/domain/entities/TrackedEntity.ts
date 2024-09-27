import { Id, NamedRef, Ref } from "./Base";
import { ProgramEvent } from "./ProgramEvent";

export interface TrackedEntity extends Ref {
    id: Id;
    attributes: AttributeValue[];
    orgUnit: Id;
    trackedEntityType: Id;
    programId: Id;
    enrollments: Enrollment[];
}

export type Enrollment = {
    id: Id;
    orgUnit: NamedRef;
    events: ProgramEvent[];
};

export type AttributeValue = {
    attributeId: Id;
    value: string;
    storedBy: string;
};
