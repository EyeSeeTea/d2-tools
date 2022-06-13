import { D2Api } from "@eyeseetea/d2-api/2.36";
import { Async } from "domain/entities/Async";
import { DataElement } from "domain/entities/DataElement";
import { DataElementsRepository } from "domain/repositories/DataElementsRepository";
import { runMetadata } from "./dhis2-utils";

export class DataElementsD2Repository implements DataElementsRepository {
    constructor(private api: D2Api) {}

    async get(): Async<DataElement[]> {
        return this.getDataElements();
    }

    async save(dataElements: DataElement[]): Async<void> {
        return runMetadata(this.api.metadata.post({ dataElements }, { mergeMode: "MERGE" }), {
            description: "dataElements",
        });
    }

    private async getDataElements() {
        const res$ = this.api.metadata.get({
            dataElements: {
                fields: {
                    id: true,
                    name: true,
                    formName: true,
                    shortName: true,
                    valueType: true,
                    domainType: true,
                    aggregationType: true,
                    translations: true,
                },
            },
        });

        const { dataElements } = await res$.getData();

        return dataElements.map(de => ({
            ...de,
            translations: de.translations || [],
        }));
    }
}
