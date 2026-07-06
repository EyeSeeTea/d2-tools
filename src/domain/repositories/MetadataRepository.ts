import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import {
    MetadataModel,
    MetadataObject,
    MetadataObjectWithTranslations,
} from "domain/entities/MetadataObject";
import { Paginated } from "domain/entities/Pagination";

export interface MetadataRepository {
    getPaginated(options: { model: MetadataModel; page: number }): Async<Paginated<MetadataObject>>;
    getAllWithTranslations(
        models: MetadataModel[],
        options?: GetTranslationsOptions
    ): Async<MetadataObjectWithTranslations[]>;
    save<Obj extends MetadataObject>(
        objects: Obj[],
        options: SaveOptions
    ): Async<{ payload: Payload; stats: object }>;
}

/* When programId is set, objects are taken from that program's metadata dependency export
   (/api/programs/{id}/metadata) instead of the whole instance. */
export interface GetTranslationsOptions {
    programId?: Id;
}

export type Payload = Record<MetadataModel, object[]>;

export interface SaveOptions {
    dryRun: boolean;
}
