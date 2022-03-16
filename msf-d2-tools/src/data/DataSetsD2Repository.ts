import { CompareResult } from "domain/entities/CompareResult";
import { DataSetsRepository } from "domain/repositories/DataSetsRepository";
import { D2Api, D2DataSetSchema, Id, SelectedPick } from "types/d2-api";

type DataSet = SelectedPick<D2DataSetSchema, { $owner: true }>;

export class DataSetsD2Repository implements DataSetsRepository {
    constructor(private api: D2Api) {}

    async compare(id1: Id, id2: Id): Promise<CompareResult> {
        const metadata$ = this.api.metadata.get({
            dataSets: {
                fields: { $owner: true },
                filter: { id: { in: [id1, id2] } },
            },
        });
        const { dataSets } = await metadata$.getData();
        const [dataSet1, dataSet2] = dataSets;
        if (!dataSet1 || !dataSet2) throw new Error("Data set(s) not found");

        return Promise.resolve({ type: "equal" });
    }
}
