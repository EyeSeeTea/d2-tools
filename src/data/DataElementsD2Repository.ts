import _ from "lodash";
import { D2Api, Id } from "types/d2-api";
import { NamedRef } from "domain/entities/Base";
import { DataElementsRepository } from "domain/repositories/DataElementsRepository";

export class DataElementsD2Repository implements DataElementsRepository {
    constructor(private api: D2Api) {}

    async getDataElementsNames(ids: Id[]): Promise<NamedRef[]> {
        const metadata$ = this.api.metadata.get({
            dataElements: {
                fields: {
                    id: true,
                    name: true,
                },
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
