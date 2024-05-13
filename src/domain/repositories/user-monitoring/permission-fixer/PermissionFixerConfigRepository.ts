import { Async } from "domain/entities/Async";
import { PermissionFixerMetadataConfig } from "domain/entities/user-monitoring/permission-fixer/PermissionFixerConfigOptions";

export interface PermissionFixerConfigRepository {
    get(): Async<PermissionFixerMetadataConfig>;
}
