export type Stats = {
    created: number;
    ignored: number;
    updated: number;
};

export function getStats(stats: Stats[]) {
    return stats.reduce(
        (acum, stat) => {
            return {
                created: acum.created + stat.created,
                ignored: acum.ignored + stat.ignored,
                updated: acum.updated + stat.updated,
            };
        },
        {
            created: 0,
            ignored: 0,
            updated: 0,
        }
    );
}

export type Result =
    | { type: "success"; message?: string; stats?: Stats }
    | { type: "error"; message: string; stats?: Stats };
