import { PermissionFixerUserOptions } from "domain/entities/user-monitoring/permission-fixer/PermissionFixerUserOptions";

export interface PermissionFixerConfigRepository {
    get(): Promise<PermissionFixerUserOptions>;
}
