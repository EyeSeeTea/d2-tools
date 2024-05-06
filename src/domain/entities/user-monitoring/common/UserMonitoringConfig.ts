import { NamedRef } from "domain/entities/Base";
import _ from "lodash";

export interface UserMonitoringConfig {
    excludeRoleByRole: ExcludeRoleByRole[];
    excludeRoleByGroup: ExcludeRoleByGroup[];
    excludeRoleByUser: ExcludeRoleByUser[];
    excludeRoles: ExcludeRoles;
    excludeUsers: ExcludeUsers;
    templateGroups: TemplateGroups[];
    pushReport: boolean;
    minimalGroup: NamedRef;
    minimalRole: NamedRef;
    pushProgram: NamedRef;
}

export interface ExcludeRoleByRole {
    active_role: NamedRef;
    ignore_role: NamedRef;
}

export interface ExcludeRoleByGroup {
    role: NamedRef;
    group: NamedRef;
}

export interface ExcludeRoleByUser {
    role: NamedRef;
    user: NamedRef;
}

export interface ExcludeRoles {
    roles: NamedRef[];
}

export interface ExcludeUsers {
    users: NamedRef[];
}

export interface TemplateGroups {
    group: NamedRef;
    template: NamedRef;
}
