import { Id } from "domain/entities/Base";
import { PermissionFixerUserGroupExtended } from "domain/entities/user-monitoring/permission-fixer/PermissionFixerUserGroupExtended";

export interface PermissionFixerUserGroupRepository {
    getByIds(ids: Id[]): Promise<PermissionFixerUserGroupExtended[]>;
    save(userGroup: PermissionFixerUserGroupExtended): Promise<string>;
}
