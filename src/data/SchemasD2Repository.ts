import _ from "lodash";
import { Async } from "domain/entities/Async";
import { MetadataModel } from "domain/entities/MetadataObject";
import { TranslatableField } from "domain/entities/Translation";
import { SchemasRepository } from "domain/repositories/SchemasRepository";
import { D2Api } from "types/d2-api";

export class SchemasD2Repository implements SchemasRepository {
    constructor(private api: D2Api) {}

    async getTranslatableFields(): Async<Record<MetadataModel, TranslatableField[]>> {
        const res = await this.api
            .get<D2SchemasResponse>("/schemas", { fields: "plural,properties[name,translatable]" })
            .getData();

        return _(res.schemas)
            .map(schema => {
                const fields = _(schema.properties)
                    .filter(property => property.translatable)
                    .map(property => property.name)
                    .value();

                return [schema.plural, fields] as [MetadataModel, TranslatableField[]];
            })
            .fromPairs()
            .value();
    }
}

interface D2SchemasResponse {
    schemas: Array<{
        plural: string;
        properties: Array<{ name: string; translatable: boolean }>;
    }>;
}
