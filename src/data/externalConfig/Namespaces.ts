export const dataStoreNamespace = "d2-tools";
export const constantPrefix = "D2-tools Storage";

export type Namespace = typeof Namespace[keyof typeof Namespace];
export const Namespace = {
    USER_MONITORING: "user-monitoring",
    PUSH_REPORT: "PUSH_REPORT",
    MINIMAL_GROUP: "MINIMAL_GROUP",
    MINIMAL_ROLE: "MINIMAL_ROLE",
    PUSH_PROGRAM_ID: "PUSH_PROGRAM_ID",
    EXCLUDE_ROLES_BY_ROLE: "EXCLUDE_ROLES_BY_ROLE",
    EXCLUDE_ROLES_BY_GROUPS: "EXCLUDE_ROLES_BY_GROUPS",
    EXCLUDE_ROLES_BY_USERS: "EXCLUDE_ROLES_BY_USERS",
    EXCLUDE_ROLES: "EXCLUDE_ROLES",
    EXCLUDE_USERS: "EXCLUDE_USERS",
    TEMPLATE_GROUPS: "TEMPLATE_GROUPS",
    TWO_FACTOR_GROUP_ID: "TWO_FACTOR_GROUP_ID",
};

export const NamespaceProperties: Record<string, string[]> = {
    [Namespace.USER_MONITORING]: ["user-monitoring"],
    [Namespace.PUSH_REPORT]: [],
    [Namespace.MINIMAL_GROUP]: [],
    [Namespace.MINIMAL_ROLE]: [],
    [Namespace.PUSH_PROGRAM_ID]: [],
    [Namespace.EXCLUDE_ROLES_BY_ROLE]: [],
    [Namespace.EXCLUDE_ROLES_BY_GROUPS]: [],
    [Namespace.EXCLUDE_ROLES_BY_USERS]: [],
    [Namespace.EXCLUDE_ROLES]: [],
    [Namespace.EXCLUDE_USERS]: [],
    [Namespace.TEMPLATE_GROUPS]: [],
};
