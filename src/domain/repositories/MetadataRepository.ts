import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import {
    MetadataModel,
    MetadataObject,
    MetadataObjectWithTranslations,
} from "domain/entities/MetadataObject";
import { Paginated } from "domain/entities/Pagination";
import { GetTranslationsOptions, MetadataSourceRepository } from "./MetadataSourceRepository";

export { GetTranslationsOptions };

export interface MetadataRepository extends MetadataSourceRepository {
    getPaginated(options: { model: MetadataModel; page: number }): Async<Paginated<MetadataObject>>;
    getAllWithTranslations(
        models: MetadataModel[],
        options?: GetTranslationsOptions
    ): Async<MetadataObjectWithTranslations[]>;
    getByIdsWithTranslations(model: MetadataModel, ids: Id[]): Async<MetadataObjectWithTranslations[]>;
    save<Obj extends MetadataObject>(
        objects: Obj[],
        options: SaveOptions
    ): Async<{ payload: Payload; stats: object }>;
}

export type Payload = Record<MetadataModel, object[]>;

export interface SaveOptions {
    dryRun: boolean;
}
