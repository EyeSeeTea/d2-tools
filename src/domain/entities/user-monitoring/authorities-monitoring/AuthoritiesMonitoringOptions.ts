import { AuthoritiesMonitor } from "../common/AuthoritiesMonitor";
import {
    ExcludeRoleByGroup,
    ExcludeRoleByRole,
    ExcludeRoleByUser,
    ExcludeRoles,
    ExcludeUsers,
    TemplateGroups,
} from "../common/ConfigClient";
import { Ref } from "domain/entities/Base";

export interface AuthoritiesMonitoringOptions extends monitoringConfig {
    AUTHORITIES_MONITOR: AuthoritiesMonitor;
}

export interface monitoringConfig {
    PUSH_REPORT: boolean;
    MINIMAL_GROUP: Ref;
    MINIMAL_ROLE: Ref;
    PUSH_PROGRAM_ID: Ref;
    EXCLUDE_ROLES_BY_ROLE: ExcludeRoleByRole[];
    EXCLUDE_ROLES_BY_GROUPS: ExcludeRoleByGroup[];
    EXCLUDE_ROLES_BY_USERS: ExcludeRoleByUser[];
    EXCLUDE_ROLES: ExcludeRoles;
    EXCLUDE_USERS: ExcludeUsers;
    TEMPLATE_GROUPS: TemplateGroups[];
    TWO_FACTOR_GROUP_ID: Ref;
    AUTHORITIES_MONITOR: AuthoritiesMonitor;
}
