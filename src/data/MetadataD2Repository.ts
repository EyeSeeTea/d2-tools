import _ from "lodash";
import { D2Api } from "@eyeseetea/d2-api/2.36";
import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { MetadataRepository, Paginated, Payload, SaveOptions } from "domain/repositories/MetadataRepository";
import { runMetadata } from "./dhis2-utils";
import log from "utils/log";
import {
    MetadataModel,
    MetadataObject,
    MetadataObjectWithTranslations,
} from "domain/entities/MetadataObject";
import { D2Translation } from "@eyeseetea/d2-api/schemas";
import { Maybe } from "utils/ts-utils";
import { Pager } from "domain/entities/Pager";

export class MetadataD2Repository implements MetadataRepository {
    constructor(private api: D2Api) {}

    async getAllWithTranslations(models: string[]): Async<MetadataObjectWithTranslations[]> {
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

    async getPaginated(options: { model: MetadataModel; page: number }): Async<Paginated<MetadataObject>> {
        // endpoint users pager has a for older DHIS2 (page > 1 return only one object),
        // don't page in this case.
        if (options.model === "users") {
            const pageSize = 100_000;

            const res$ = this.api.get<{ pager: Pager } & { [K in string]: D2User[] }>(`/${options.model}`, {
                fields: "id,name,userCredentials[username]",
                pageSize: pageSize,
                page: options.page,
            });
            const res = await res$.getData();

            const objects = _(res[options.model])
                .map(
                    (user): MetadataObject => ({
                        ...user,
                        model: options.model,
                        code: user.userCredentials.username,
                    })
                )
                .value();

            return { objects: objects, pager: res.pager };
        } else {
            const pageSize = 1_000;

            const res$ = this.api.get<{ pager: Pager } & { [K in string]: BasicD2Object[] }>(
                `/${options.model}`,
                {
                    fields: "id,name,code",
                    pageSize: pageSize,
                    page: options.page,
                }
            );
            const res = await res$.getData();

            const objects = _(res[options.model])
                .map((obj): MetadataObject => ({ ...obj, model: options.model }))
                .value();

            return { objects: objects, pager: res.pager };
        }
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
            .map(model => [`${model}:fields`, ":owner"] as [string, string])
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

    private async getMetadataObjects(models: string[]): Async<MetadataObjectWithTranslations[]> {
        const metadata = await this.getD2Metadata(models);

        return _(metadata)
            .toPairs()
            .flatMap(([modelPlural, d2Objects]) => {
                return _(d2Objects)
                    .map((d2Object): Maybe<MetadataObjectWithTranslations> => {
                        return d2Object.id
                            ? {
                                  code: d2Object.code,
                                  ...d2Object,
                                  model: modelPlural,
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

interface BasicD2Object {
    id: Id;
    name: string;
    code: Maybe<string>;
}

interface D2User {
    id: Id;
    name: string;
    userCredentials: { username: string };
}
