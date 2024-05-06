import { Async } from "domain/entities/Async";
import { UserMonitoringUser } from "domain/entities/user-monitoring/common/UserMonitoringUser";
import { PermissionFixerTemplateGroupExtended } from "domain/entities/user-monitoring/permission-fixer/PermissionFixerTemplates";
import { PermissionFixerUserOptions } from "domain/entities/user-monitoring/permission-fixer/PermissionFixerUserOptions";

export interface PermissionFixerTemplateRepository {
    getTemplateAuthorities(
        options: PermissionFixerUserOptions,
        userTemplates: UserMonitoringUser[]
    ): Promise<Async<PermissionFixerTemplateGroupExtended[]>>;
}
