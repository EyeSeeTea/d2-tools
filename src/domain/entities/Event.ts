import { Id } from "./Base";
import { DataValue } from "./DataValue";

export type EventMetadata = {
    event: Id;
    orgUnit: Id;
    program: Id;
    programStage: Id;
    status: "ACTIVE" | "COMPLETED" | "VISITED" | "SCHEDULED" | "OVERDUE" | "SKIPPED";
    eventDate: string;
    dataValues: Pick<DataValue, "dataElement" | "value">[];
};

export type Stats = {
    created: number;
    ignored: number;
    updated: number;
};
