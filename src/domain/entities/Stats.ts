import { Id } from "./Base";

export type Stats = {
    recordsSkipped: Id[];
    created: number;
    ignored: number;
    updated: number;
    errorMessage: string;
};
