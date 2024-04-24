import { Id } from "./Identifier";

export interface UserRoleAuthority {
    id: Id;
    authorities: string[];
    name: string;
}
