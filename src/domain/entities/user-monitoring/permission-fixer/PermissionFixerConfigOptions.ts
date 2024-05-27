import { NamedRef } from "domain/entities/Base";
import { PermissionFixerTemplateGroup } from "./PermissionFixerTemplates";
import { RolesByUser } from "./RolesByUser";
import { RolesByGroup } from "./RolesByGroup";
import { RolesByRoles } from "./RolesByRoles";

export interface PermissionFixerMetadataConfig {
    templates: PermissionFixerTemplateGroup[];
    excludedRoles: NamedRef[];
    excludedUsers: NamedRef[];
    excludedRolesByUser: RolesByUser[];
    excludedRolesByGroup: RolesByGroup[];
    excludedRolesByRole: RolesByRoles[];
    pushProgramId: NamedRef;
    minimalGroupId: NamedRef;
    minimalRoleId: NamedRef;
    permissionFixerConfig: PermissionFixerConfig;
}

export interface PermissionFixerConfig {
    pushReport: boolean;
    pushFixedUsersRoles: boolean;
    pushFixedUserGroups: boolean;
}
