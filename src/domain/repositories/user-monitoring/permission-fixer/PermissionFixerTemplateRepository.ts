import { PermissionFixerTemplateGroupExtended } from "domain/entities/user-monitoring/permission-fixer/PermissionFixerTemplates";
import { PermissionFixerConfigOptions } from "domain/entities/user-monitoring/permission-fixer/PermissionFixerConfigOptions";
import { PermissionFixerUser } from "domain/entities/user-monitoring/permission-fixer/PermissionFixerUser";
import { Async } from "domain/entities/Async";

export interface PermissionFixerTemplateRepository {
    getTemplateAuthorities(
        options: PermissionFixerConfigOptions,
        userTemplates: PermissionFixerUser[]
    ): Async<PermissionFixerTemplateGroupExtended[]>;
}
