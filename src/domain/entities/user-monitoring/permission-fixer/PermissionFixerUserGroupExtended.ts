import { Ref } from "domain/entities/Base";

export interface PermissionFixerUserGroupExtended {
    name: string;
    id: string;
    users: Ref[];
}
