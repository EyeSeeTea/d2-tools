import _ from "lodash";
import { D2Api, MetadataPick } from "@eyeseetea/d2-api/2.36";
import { Async } from "domain/entities/Async";
import { getId, Id } from "domain/entities/Base";
import { DataElement } from "domain/entities/DataElement";
import { DataElementsRepository } from "domain/repositories/DataElementsRepository";
import { promiseMap, runMetadata } from "./dhis2-utils";
import { PartialBy } from "@eyeseetea/d2-api/utils/types";
import log from "utils/log";

export class DataElementsD2Repository implements DataElementsRepository {
    constructor(private api: D2Api) {}

    async get(): Async<DataElement[]> {
        return this.getDataElements();
    }

    async save(dataElements: DataElement[]): Async<void> {
        const dataElementsToPost = await this.mergeWithExistingDataElements(dataElements);
        const payload = { dataElements: _.compact(dataElementsToPost) };

        return runMetadata(this.api.metadata.post(payload, { mergeMode: "MERGE" }), {
            description: "dataElements",
        });
    }

    private async mergeWithExistingDataElements(dataElements: DataElement[]) {
        const dataElementsById = _.keyBy(dataElements, getId);
        const dataElementsDb = await this.getDataElementsByIds({ ids: dataElements.map(getId) });
        const dataElementsToPost = dataElementsDb.map((dataElementDb): DataElementDb | null => {
            const dataElement = dataElementsById[dataElementDb.id];

            if (!dataElement) {
                log.warn(`Cannot save new data elements: ${dataElementDb.name}`);
                return null;
            } else {
                return { ...dataElementDb, ...dataElement };
            }
        });

        return dataElementsToPost;
    }

    private async getDataElements() {
        const res$ = this.api.metadata.get({
            dataElements: {
                fields: { id: true, name: true, formName: true, translations: true },
            },
        });
        const { dataElements } = await res$.getData();
        return dataElements.map(buildDataElement);
    }

    private async getDataElementsByIds(options: { ids: Id[] }): Promise<DataElementDb[]> {
        return getInChunks(options.ids, async idsGroup => {
            const res$ = this.api.metadata.get({
                dataElements: { fields: { $owner: true }, filter: { id: { in: idsGroup } } },
            });
            return res$.getData().then(res => res.dataElements);
        });
    }
}

type DataElementDb = MetadataPick<{ dataElements: { fields: { $owner: true } } }>["dataElements"][number];

function buildDataElement(dataElement: PartialBy<DataElement, "translations">): DataElement {
    return {
        ...dataElement,
        translations: dataElement.translations || [],
    };
}

async function getInChunks<T>(ids: Id[], getter: (idsGroup: Id[]) => Promise<T[]>): Promise<T[]> {
    const objsCollection = await promiseMap(_.chunk(ids, 300), idsGroup => getter(idsGroup));
    return _.flatten(objsCollection);
}
