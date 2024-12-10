import { Async } from "domain/entities/Async";
import { Id, Ref } from "domain/entities/Base";
import { PermissionFixerUserGroupExtended } from "domain/entities/user-monitoring/permission-fixer/PermissionFixerUserGroupExtended";

export interface PermissionFixerUserGroupRepository {
    get(ids: Id): Async<PermissionFixerUserGroupExtended>;
    save(userGroup: PermissionFixerUserGroupExtended, users: Ref[]): Async<string>;
}
