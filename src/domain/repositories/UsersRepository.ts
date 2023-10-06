import { Id } from "@eyeseetea/d2-api";
import { UserRoleAuthority } from "data/d2-users/D2Users.types";
import { Async } from "domain/entities/Async";

export interface UsersRepository {
    checkPermissions(options: UsersOptions): Promise<Async<void>>;
}

export interface TemplateGroup {
    templateId: Id;
    groupId: Id;
    validRolesByAuthority: UserRoleAuthority[];
    invalidRolesByAuthority: UserRoleAuthority[];
    validRolesById: string[];
    invalidRolesById: string[];
    name?: string;
}

export interface RolesByRoles {
    activeroleid: string;
    activerolename: string;
    ignoreroleid: string;
    ignorerolename: string;
}

export interface RolesByUser {
    userid: string;
    username: string;
    roleid: string;
    rolename: string;
}

export interface RolesByGroup {
    groupid: string;
    groupname: string;
    roleid: string;
    rolename: string;
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
    apiurl: string;
}
