import { Id, NamedRef } from "domain/entities/Base";

export interface UserRole {
    id: Id;
    authorities: string[];
    name: string;
    users: NamedRef[];
}
