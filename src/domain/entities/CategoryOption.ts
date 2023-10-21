import { Code, Id, Name, NamedRef } from "./Base";

export type PermissionType = "public" | "groups";
export type UnixFilePermission = string;
export type Permission = GroupPermission;

export interface CategoryOptionData extends NamedRef {
    code: Code;
    permissions: Permission[];
    publicPermission: UnixFilePermission;
}

export interface BasePermission {
    type: PermissionType;
    value: UnixFilePermission;
}

export interface GroupPermission extends BasePermission, NamedRef {
    type: "groups";
}

export class CategoryOption {
    public readonly id: Id;
    public readonly name: Name;
    public readonly code: Code;
    public readonly publicPermission: UnixFilePermission;
    public readonly permissions: Permission[];

    public constructor(data: CategoryOptionData) {
        this.id = data.id;
        this.name = data.name;
        this.code = data.code;
        this.publicPermission = data.publicPermission;
        this.permissions = data.permissions;
    }
}
