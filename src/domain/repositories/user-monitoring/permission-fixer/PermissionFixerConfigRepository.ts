import { PermissionFixerConfigOptions } from "domain/entities/user-monitoring/permission-fixer/PermissionFixerConfigOptions";

export interface PermissionFixerConfigRepository {
    get(): Promise<PermissionFixerConfigOptions>;
}
