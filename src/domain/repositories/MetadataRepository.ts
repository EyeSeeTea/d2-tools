import { Async } from "domain/entities/Async";
import {
    MetadataModel,
    MetadataObject,
    MetadataObjectWithTranslations,
} from "domain/entities/MetadataObject";
import { Paginated } from "domain/entities/Pagination";

export interface MetadataRepository {
    getPaginated(options: { model: MetadataModel; page: number }): Async<Paginated<MetadataObject>>;
    getAllWithTranslations(models: MetadataModel[]): Async<MetadataObjectWithTranslations[]>;
    save<Obj extends MetadataObject>(
        objects: Obj[],
        options: SaveOptions
    ): Async<{ payload: Payload; stats: object }>;
}

export type Payload = Record<MetadataModel, object[]>;

export interface SaveOptions {
    dryRun: boolean;
}
