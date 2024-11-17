import { Id, NamedRef } from "domain/entities/Base";

export type User = {
    id: Id;
    username: string;
    userRoles: NamedRef[];
};
