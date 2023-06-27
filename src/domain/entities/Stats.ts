import { Id } from "./Base";

export type Stats = {
    usersSkipped: Id[];
    created: number;
    ignored: number;
    updated: number;
    errorMessage: string;
};
