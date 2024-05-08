export type Namespace = typeof Namespace[keyof typeof Namespace];

export const Namespace = {
    D2_TOOLS: "d2-tools",
} as const;

export const NamespaceProperties: Record<string, string[]> = {
    [Namespace.D2_TOOLS]: [],
};
