import { NamedRef } from "domain/entities/Base";
import { PermissionFixerUserRoleAuthority } from "./PermissionFixerUserRoleAuthority";

export interface PermissionFixerTemplateGroup {
    group: NamedRef;
    template: NamedRef;
}

export interface PermissionFixerTemplateGroupExtended extends PermissionFixerTemplateGroup {
    validRolesByAuthority: PermissionFixerUserRoleAuthority[];
    invalidRolesByAuthority: PermissionFixerUserRoleAuthority[];
    validRolesById: string[];
    invalidRolesById: string[];
}
