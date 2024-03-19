import { UnixFilePermission } from "./CategoryOption";

export type RegularExpresionValue = string;

export type CategoryOptionSettings = Record<RegularExpresionValue, PermissionSetting>;
export type PermissionImportMode = "append" | "overwrite";

export type PermissionSetting = {
    permissionImportMode: PermissionImportMode;
    public?: PublicPermissionSetting;
    groups?: GroupPermissionSetting[];
};

export type PublicPermissionSetting = {
    value: UnixFilePermission;
};

export type GroupPermissionSetting = {
    filter: string;
    value: UnixFilePermission;
};
