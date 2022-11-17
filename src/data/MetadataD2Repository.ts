import _ from "lodash";
import { D2Api } from "@eyeseetea/d2-api/2.36";
import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { MetadataRepository, Payload, SaveOptions } from "domain/repositories/MetadataRepository";
import { runMetadata } from "./dhis2-utils";
import log from "utils/log";
import { MetadataObject } from "domain/entities/MetadataObject";
import { D2Translation } from "@eyeseetea/d2-api/schemas";
import { Maybe } from "utils/ts-utils";

export class MetadataD2Repository implements MetadataRepository {
    constructor(private api: D2Api) {}

    async get(models: string[]): Async<MetadataObject[]> {
        return this.getMetadataObjects(models);
    }

    async save(objects: MetadataObject[], options: SaveOptions): Async<{ payload: Payload; stats: object }> {
        const payload = await this.mergeWithExistingObjects(objects);

        const res = await runMetadata(
            this.api.metadata.post(payload, {
                mergeMode: "REPLACE",
                importMode: options.dryRun ? "VALIDATE" : "COMMIT",
            })
        );

        return { payload, stats: res.stats };
    }

    private async mergeWithExistingObjects(objects: MetadataObject[]): Async<Metadata> {
        const models = _(objects)
            .map(obj => obj.model)
            .uniq()
            .value();

        const objectsExisting = await this.getD2Objects(models);
        const objectsExistingById = _.keyBy(objectsExisting, obj => obj.id);

        const metadataToPost = _(objects)
            .map(object => {
                const objectExisting = objectsExistingById[object.id];

                if (!objectExisting) {
                    log.warn(`Cannot find object: ${object.id}`);
                    return undefined;
                } else {
                    return {
                        model: object.model,
                        object: { ...objectExisting, ...buildObject(object) },
                    };
                }
            })
            .compact()
            .groupBy(o => o.model + "s") // Metadata payload uses plural name for models.
            .mapValues(os => os.map(o => o.object))
            .value();

        return metadataToPost;
    }

    private async getD2Metadata(models: string[]): Async<Metadata> {
        const params = _(models)
            .map(model => [`${model + "s"}:fields`, ":owner"] as [string, string])
            .fromPairs()
            .value();

        type Model = string;
        type MetadataRes = Record<Model, Array<D2Object>>;

        return this.api.get<MetadataRes>("/metadata", params).getData();
    }

    private async getD2Objects(models: string[]): Async<D2Object[]> {
        const metadata = await this.getD2Metadata(models);
        return _(metadata).values().flatten().value();
    }

    private async getMetadataObjects(models: string[]): Async<MetadataObject[]> {
        const metadata = await this.getD2Metadata(models);

        return _(metadata)
            .toPairs()
            .flatMap(([modelPlural, d2Objects]) => {
                return _(d2Objects)
                    .map((d2Object): Maybe<MetadataObject> => {
                        return d2Object.id
                            ? {
                                  code: "",
                                  ...d2Object,
                                  model: modelPlural.replace(/s$/, ""), // singularize model
                                  translations: d2Object.translations || [],
                              }
                            : undefined;
                    })
                    .compact()
                    .value();
            })
            .value();
    }
}

type Model = string;

type Metadata = Record<Model, Array<D2Object>>;

interface D2ObjectBase {
    id: Id;
    name: string;
    code?: string;
    translations: D2Translation[];
}

type D2Object = D2ObjectBase & {
    withOwnerFields: never;
};

function buildObject(object: MetadataObject): Partial<D2Object> {
    return object;
}
