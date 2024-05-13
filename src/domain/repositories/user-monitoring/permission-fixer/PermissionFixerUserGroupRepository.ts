import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { PermissionFixerUserGroupExtended } from "domain/entities/user-monitoring/permission-fixer/PermissionFixerUserGroupExtended";

export interface PermissionFixerUserGroupRepository {
    getByIds(ids: Id[]): Async<PermissionFixerUserGroupExtended[]>;
    save(userGroup: PermissionFixerUserGroupExtended): Async<string>;
}
