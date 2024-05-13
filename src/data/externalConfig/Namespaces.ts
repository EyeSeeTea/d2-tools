export const d2ToolsNamespace = "d2-tools";

export type Namespace = typeof Namespace[keyof typeof Namespace];

export const Namespace = {
    USER_MONITORING: "user-monitoring",
    TWO_FACTOR_MONITORING: "two-factor-monitoring",
} as const;

export const NamespaceProperties: Record<string, string[]> = {
    [Namespace.USER_MONITORING]: [],
    [Namespace.TWO_FACTOR_MONITORING]: [],
};
