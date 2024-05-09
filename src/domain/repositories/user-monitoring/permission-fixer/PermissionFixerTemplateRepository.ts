import { Async } from "domain/entities/Async";
import { UserMonitoringUser } from "domain/entities/user-monitoring/common/UserMonitoringUser";
import { PermissionFixerTemplateGroupExtended } from "domain/entities/user-monitoring/permission-fixer/PermissionFixerTemplates";
import { PermissionFixerConfigOptions } from "domain/entities/user-monitoring/permission-fixer/PermissionFixerConfigOptions";

export interface PermissionFixerTemplateRepository {
    getTemplateAuthorities(
        options: PermissionFixerConfigOptions,
        userTemplates: UserMonitoringUser[]
    ): Promise<Async<PermissionFixerTemplateGroupExtended[]>>;
}
