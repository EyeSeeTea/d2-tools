import _ from "lodash";
import { DataSetsRepository, OUCopyResult } from "domain/repositories/DataSetsRepository";
import { D2Api, Id, PostOptions } from "types/d2-api";
import { dataSetSchema } from "./DataSetSchema";
import { DataSet, DataSetMetadata, DataSetToCompare } from "domain/entities/DataSet";
import { runMetadata } from "./dhis2-utils";

export class DataSetsD2Repository implements DataSetsRepository {
    constructor(private api: D2Api) {}

    async getAll(): Promise<DataSet[]> {
        const metadata$ = this.api.metadata.get({ dataSets: { fields } });
        const { dataSets } = await metadata$.getData();

        return dataSets;
    }

    async get(ids: Id[]): Promise<Record<Id, DataSet>> {
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

    async getComparableDataSets(ids: Id[]): Promise<Record<Id, DataSetToCompare>> {
        const fields = { ...dataSetSchema, id: true as const, name: true as const };

        const metadata$ = this.api.metadata.get({
            dataSets: { fields, filter: { id: { in: ids } } },
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

    async post(data: DataSetMetadata): Promise<OUCopyResult> {
        try {
            const options: Partial<PostOptions> = { async: false };
            const response = await runMetadata(this.api.metadata.post(data, options));

            if (response.status !== "OK") {
                console.error(JSON.stringify(response.typeReports, null, 4));
            }

            return response.status;
        } catch (errror) {
            console.debug(errror);
            return "ERROR";
        }
    }

    getSchema(): object {
        return dataSetSchema;
    }
}

const fields = {
    $owner: true,
    id: true,
    name: true,
    categoryCombo: { id: true, categoryOptionCombos: { id: true, name: true } },
    dataSetElements: {
        dataElement: {
            id: true,
            categoryCombo: { id: true, categoryOptionCombos: { id: true } },
        },
        categoryCombo: { id: true, categoryOptionCombos: { id: true } },
    },
    dataInputPeriods: { period: { id: true } },
    organisationUnits: { id: true },
} as const;
