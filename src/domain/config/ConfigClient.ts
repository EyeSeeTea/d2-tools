import { Item } from "domain/entities/user-monitoring/UserMonitoring";
import _ from "lodash";

export interface ConfigClient {
    excludeRoleByRole: ExcludeRoleByRole[];
    excludeRoleByGroup: ExcludeRoleByGroup[];
    excludeRoleByUser: ExcludeRoleByUser[];
    excludeRoles: ExcludeRoles;
    excludeUsers: ExcludeUsers;
    templateGroups: TemplateGroups[];
    pushReport: boolean;
    minimalGroup: Item;
    minimalRole: Item;
    pushProgram: Item;
}
export interface Identifier {
    id: string;
    name: string;
}

export interface ExcludeRoleByRole {
    active_role: Identifier;
    ignore_role: Identifier;
}

export interface ExcludeRoleByGroup {
    role: Identifier;
    group: Identifier;
}

export interface ExcludeRoleByUser {
    role: Identifier;
    user: Identifier;
}

export interface ExcludeRoles {
    roles: Identifier[];
}

export interface ExcludeUsers {
    users: Identifier[];
}

export interface TemplateGroups {
    group: Identifier;
    template: Identifier;
}
