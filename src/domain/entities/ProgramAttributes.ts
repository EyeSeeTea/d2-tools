import { Id } from "./Base";

export type ProgramAttributes = {
    id: Id;
    attributes: Attribute[];
    orgUnit: Id;
    trackedEntityType: Id;
    programId: Id;
};

export type Attribute = {
    attribute: Id;
    value: string;
    storedBy: string;
};
