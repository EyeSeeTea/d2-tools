import { Id } from "domain/entities/Base";

export interface UserRoleAuthority {
    id: Id;
    authorities: string[];
    name: string;
}
