import { Async } from "domain/entities/Async";
import { TemplateGroupWithAuthorities } from "domain/entities/user-monitoring/common/Templates";
import { User } from "domain/entities/user-monitoring/common/User";
import { PermissionFixerUserOptions } from "domain/entities/user-monitoring/permission-fixer/PermissionFixerUserOptions";

export interface TemplateRepository {
    getTemplateAuthorities(
        options: PermissionFixerUserOptions,
        userTemplates: User[]
    ): Promise<Async<TemplateGroupWithAuthorities[]>>;
}
