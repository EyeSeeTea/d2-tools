import _ from "lodash";
import { D2Api, Id, MetadataPick } from "types/d2-api";
import { DataElementsRepository } from "domain/repositories/DataElementsRepository";
import { DataElement } from "domain/entities/DataElement";

export class DataElementsD2Repository implements DataElementsRepository {
    constructor(private api: D2Api) {}

    async getByIds(ids: Id[]): Promise<DataElement[]> {
        return this.getDataElements(ids);
    }

    private async getDataElements(ids: Id[]): Promise<D2DataElement[]> {
        const metadata$ = this.api.metadata.get({
            dataElements: {
                fields: dataElementFields,
                filter: { id: { in: ids } },
            },
        });

        const { dataElements } = await metadata$.getData();
        const dataElementsIds = dataElements.map(de => de.id);
        const dataElementsIdsNotFound = _.difference(ids, dataElementsIds);

        if (!_.isEmpty(dataElementsIdsNotFound)) {
            throw new Error(`Data Elements not found: ${dataElementsIdsNotFound.join(", ")}`);
        } else {
            return dataElements;
        }
    }
}

const dataElementFields = {
    id: true,
    name: true,
    valueType: true,
} as const;

type D2DataElement = MetadataPick<{
    dataElements: { fields: typeof dataElementFields };
}>["dataElements"][number];
