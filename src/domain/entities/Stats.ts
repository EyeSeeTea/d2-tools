import { Id } from "./Base";

type StatsAttrs = {
    recordsSkipped: Id[];
    errorMessage: string;
    created: number;
    ignored: number;
    updated: number;
    deleted: number;
    total: number;
};

export class Stats {
    public readonly recordsSkipped: Id[];
    public readonly errorMessage: string;
    public readonly created: number;
    public readonly ignored: number;
    public readonly updated: number;
    public readonly deleted: number;
    public readonly total: number;

    constructor(attrs: StatsAttrs) {
        this.recordsSkipped = attrs.recordsSkipped;
        this.created = attrs.created;
        this.ignored = attrs.ignored;
        this.updated = attrs.updated;
        this.deleted = attrs.deleted;
        this.errorMessage = attrs.errorMessage;
        this.total = attrs.total;
    }

    static combine(stats: Stats[]): Stats {
        return stats.reduce((acum, stat) => {
            return {
                recordsSkipped: [...acum.recordsSkipped, ...stat.recordsSkipped],
                errorMessage: `${acum.errorMessage}${stat.errorMessage}`,
                created: acum.created + stat.created,
                ignored: acum.ignored + stat.ignored,
                updated: acum.updated + stat.updated,
                deleted: acum.deleted + stat.deleted,
                total: acum.total + stat.total,
            };
        }, Stats.empty());
    }

    static empty(): Stats {
        return {
            recordsSkipped: [],
            errorMessage: "",
            created: 0,
            ignored: 0,
            updated: 0,
            deleted: 0,
            total: 0,
        };
    }
}
