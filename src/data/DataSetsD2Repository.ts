import _ from "lodash";
import { DataSetsRepository } from "domain/repositories/DataSetsRepository";
import { D2Api, Id } from "types/d2-api";
import { dataSetSchema } from "./DataSetSchema";
import { DataSet } from "domain/entities/DataSet";

export class DataSetsD2Repository implements DataSetsRepository {
    constructor(private api: D2Api) {}

    async get(ids: Id[]): Promise<Record<Id, DataSet>> {
        const fields = { ...dataSetSchema, id: true as const, name: true as const };

        const metadata$ = this.api.metadata.get({
            dataSets: {
                fields,
                filter: { id: { in: ids } },
            },
        });

        const { dataSets } = await metadata$.getData();
        const dataSetIds = dataSets.map(ds => ds.id);
        const dataSetsIdsNotFound = _.difference(ids, dataSetIds);

        if (!_.isEmpty(dataSetsIdsNotFound)) {
            throw new Error(`Datasets not found: ${dataSetsIdsNotFound.join(", ")}`);
        } else {
            return _.keyBy(dataSets, dataSet => dataSet.id);
        }
    }

    getSchema(): object {
        return dataSetSchema;
    }
}
