import { Async } from "domain/entities/Async";
import { TemplateGroupWithAuthorities } from "domain/entities/user-monitoring/common/Templates";
import { PermissionFixerUserOptions } from "domain/entities/user-monitoring/permission-fixer/PermissionFixerUserOptions";

export interface TemplateRepository {
    getTemplateAuthorities(
        options: PermissionFixerUserOptions
    ): Promise<Async<TemplateGroupWithAuthorities[]>>;
}
