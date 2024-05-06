import { NamedRef } from "domain/entities/Base";
import { RolesByGroup } from "../common/RolesByGroup";
import { RolesByRoles } from "../common/RolesByRoles";
import { RolesByUser } from "../common/RolesByUser";
import { TemplateGroup } from "../common/Templates";

export interface PermissionFixerUserOptions {
    templates: TemplateGroup[];
    excludedRoles: NamedRef[];
    excludedUsers: NamedRef[];
    excludedRolesByUser: RolesByUser[];
    excludedRolesByGroup: RolesByGroup[];
    excludedRolesByRole: RolesByRoles[];
    pushReport: boolean;
    testOnly: boolean;
    pushProgramId: NamedRef;
    minimalGroupId: NamedRef;
    minimalRoleId: NamedRef;
}
