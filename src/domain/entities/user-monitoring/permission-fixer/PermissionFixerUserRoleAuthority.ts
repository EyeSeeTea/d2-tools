import { Id } from "domain/entities/Base";

export interface PermissionFixerUserRoleAuthority {
    id: Id;
    authorities: string[];
    name: string;
}
