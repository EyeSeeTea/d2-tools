import { NamedRef } from "domain/entities/Base";
import { PermissionFixerTemplateGroup } from "./PermissionFixerTemplates";
import { RolesByUser } from "./RolesByUser";
import { RolesByGroup } from "./RolesByGroup";
import { RolesByRoles } from "./RolesByRoles";

export interface PermissionFixerConfigOptions {
    templates: PermissionFixerTemplateGroup[];
    excludedRoles: NamedRef[];
    excludedUsers: NamedRef[];
    excludedRolesByUser: RolesByUser[];
    excludedRolesByGroup: RolesByGroup[];
    excludedRolesByRole: RolesByRoles[];
    pushReport: boolean;
    pushFixedUsersRoles: boolean;
    pushFixedUserGroups: boolean;
    pushProgramId: NamedRef;
    minimalGroupId: NamedRef;
    minimalRoleId: NamedRef;
}
