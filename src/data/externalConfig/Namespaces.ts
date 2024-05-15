export const d2ToolsNamespace = "d2-tools";

export type Namespace = typeof Namespace[keyof typeof Namespace];

export const Namespace = {
    PERMISSION_FIXER: "permission-fixer",
    TWO_FACTOR_MONITORING: "two-factor-monitoring",
} as const;

export const NamespaceProperties: Record<string, string[]> = {
    [Namespace.PERMISSION_FIXER]: [],
    [Namespace.TWO_FACTOR_MONITORING]: [],
};
