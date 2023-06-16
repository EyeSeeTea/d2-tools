import { Id } from "./Base";

export type Stats = {
    usersWithError: Id[];
    created: number;
    ignored: number;
    updated: number;
    errorMessage: string;
};
