import { Async } from "domain/entities/Async";
import { PermissionFixerConfigOptions } from "domain/entities/user-monitoring/permission-fixer/PermissionFixerConfigOptions";

export interface PermissionFixerConfigRepository {
    get(): Async<PermissionFixerConfigOptions>;
}
