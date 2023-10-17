import { Code, Id, Name, NamedRef } from "./Base";

export type PermissionType = "public" | "groups";
export type UnixFilePermission = string;
export type Permission = PublicPermission | GroupPermission;

export interface CategoryOptionData extends NamedRef {
    code: Code;
    permissions: Permission[];
}

export interface BasePermission {
    type: PermissionType;
    value: UnixFilePermission;
}

export interface PublicPermission extends BasePermission {
    type: "public";
    value: UnixFilePermission;
}

export interface GroupPermission extends BasePermission, NamedRef {
    type: "groups";
}

export class CategoryOption {
    public readonly id: Id;
    public readonly name: Name;
    public readonly code: Code;
    public readonly permissions: Permission[];

    public constructor(data: CategoryOptionData) {
        this.id = data.id;
        this.name = data.name;
        this.code = data.code;
        this.permissions = data.permissions;
    }
}
