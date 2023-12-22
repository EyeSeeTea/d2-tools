import { UserRoleAuthority } from "data/d2-users/D2Users.types";
import { Async } from "domain/entities/Async";

export interface UsersRepository {
    checkPermissions(options: UsersOptions): Promise<Async<void>>;
}
export interface TemplateGroup {
    group: Item;
    template: Item;
}

export interface TemplateGroupWithAuthorities extends TemplateGroup {
    validRolesByAuthority: UserRoleAuthority[];
    invalidRolesByAuthority: UserRoleAuthority[];
    validRolesById: string[];
    invalidRolesById: string[];
}

export interface RolesByRoles {
    active_role: Item;
    ignore_role: Item;
}

export interface RolesByUser {
    role: Item;
    user: Item;
}

export interface RolesByGroup {
    role: Item;
    group: Item;
}

export interface Item {
    id: string;
    name: string;
}
export interface UsersOptions {
    templates: TemplateGroup[];
    excludedRoles: Item[];
    excludedUsers: Item[];
    excludedRolesByUser: RolesByUser[];
    excludedRolesByGroup: RolesByGroup[];
    excludedRolesByRole: RolesByRoles[];
    pushReport: boolean;
    pushProgramId: Item;
    minimalGroupId: Item;
    minimalRoleId: Item;
}

export interface AuthOptions {
    apiurl: string;
}
