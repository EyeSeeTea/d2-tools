import { NamedRef } from "domain/entities/Base";

export interface RolesByUser {
    role: NamedRef;
    user: NamedRef;
}
