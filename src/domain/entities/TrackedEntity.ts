import { Id, Ref } from "./Base";

export interface TrackedEntity extends Ref {
    id: Id;
    attributes: AttributeValue[];
    orgUnit: Id;
    trackedEntityType: Id;
    programId: Id;
}

export type AttributeValue = {
    attributeId: Id;
    value: string;
    storedBy: string;
};

export type TrackedEntityTransfer = {
    trackedEntityId: Id;
    newOrgUnitId: Id;
};
