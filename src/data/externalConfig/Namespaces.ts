export const d2ToolsNamespace = "d2-tools";

export type Namespace = typeof Namespace[keyof typeof Namespace];

export const Namespace = {
    PERMISSION_FIXER: "permission-fixer",
    TWO_FACTOR_MONITORING: "two-factor-monitoring",
    AUTHORITIES_MONITOR: "authorities-monitor",
    USER_GROUPS_MONITORING: "user-groups-monitoring",
    USER_TEMPLATE_MONITORING: "user-template-monitoring",
} as const;

export const NamespaceProperties: Record<string, string[]> = {
    [Namespace.PERMISSION_FIXER]: [],
    [Namespace.TWO_FACTOR_MONITORING]: [],
    [Namespace.AUTHORITIES_MONITOR]: [],
    [Namespace.USER_GROUPS_MONITORING]: [],
    [Namespace.USER_TEMPLATE_MONITORING]: [],
};
