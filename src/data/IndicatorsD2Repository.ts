import _ from "lodash";
import { D2Api, Id } from "types/d2-api";
import { IndicatorsRepository, Indicator } from "domain/repositories/IndicatorsRepository";

export class IndicatorsD2Repository implements IndicatorsRepository {
    constructor(private api: D2Api) {}

    async get(ids: Id[]): Promise<Indicator[]> {
        const metadata$ = this.api.metadata.get({
            indicators: {
                fields,
                filter: { id: { in: ids } },
            },
        });

        const { indicators } = await metadata$.getData();
        const indicatorIds = indicators.map(ind => ind.id);
        const indicatorIdsNotFound = _.difference(ids, indicatorIds);

        if (!_.isEmpty(indicatorIdsNotFound)) {
            throw new Error(`Indicators not found: ${indicatorIdsNotFound.join(", ")}`);
        } else {
            return indicators;
        }
    }
}

const fields = {
    id: true,
    name: true,
    numerator: true,
    numeratorDescription: true,
    denominator: true,
    denominatorDescription: true,
} as const;
