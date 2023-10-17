import { UnixFilePermission } from "./CategoryOption";

export type RegularExpresionValue = string;

export type CategoryOptionSettings = Record<RegularExpresionValue, PermissionSetting>;

export type PermissionSetting = {
    public?: PublicPermissionSetting;
    groups?: GroupPermissionSetting[];
};

export type PublicPermissionSetting = {
    value: UnixFilePermission;
};

export type GroupPermissionSetting = {
    filter: RegularExpresionValue;
    value: UnixFilePermission;
};
