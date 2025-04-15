import _ from "lodash";

import { DataSetsRepository } from "../repositories/DataSetsRepository";
import { Maybe } from "../../utils/ts-utils";
import { DataSet } from "../entities/DataSet";
import log from "../../utils/log";

type SetSkipOfflineOptions = {
    year: number;
    disable: Maybe<boolean>;
};

export class SetSkipOfflineDataSetUseCase {
    constructor(private dataSetRepository: DataSetsRepository) {}

    async execute(options: SetSkipOfflineOptions) {
        const updatedDataSets = await this.dataSetRepository
            .getAll()
            .then((dataSets: DataSet[]) => this.setSkipOffline(dataSets, options));

        if (!_.isEmpty(updatedDataSets)) {
            const metadata = { dataSets: updatedDataSets };
            const result = await this.dataSetRepository.post(metadata, { skipPermissions: true });

            if (result === "ERROR") throw new Error("Error while posting the dataSets.");

            log.info(`Updated record: ${updatedDataSets.length}`);
            return result;
        } else {
            log.warn(`No datasets to update for year ${options.year}`);
            return "NO_CHANGE";
        }
    }

    private setSkipOffline(dataSets: DataSet[], options: SetSkipOfflineOptions): DataSet[] {
        return this.filterByInputPeriodBeforeYear(dataSets, options.year)
            .filter(dataSet => (options.disable ? dataSet.skipOffline : !dataSet.skipOffline))
            .map(dataSet => ({
                ...dataSet,
                skipOffline: !options.disable,
            }));
    }

    private filterByInputPeriodBeforeYear(dataSets: DataSet[], year: number): DataSet[] {
        return _(dataSets)
            .filter(({ dataInputPeriods }) => {
                const maxPeriodYear = _(dataInputPeriods)
                    .maxBy(({ period }) => parseInt(period.id.slice(0, 4)))
                    ?.period?.id.slice(0, 4);

                return maxPeriodYear ? parseInt(maxPeriodYear) <= year : false;
            })
            .value();
    }
}
