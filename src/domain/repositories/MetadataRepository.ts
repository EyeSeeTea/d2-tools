import { Async } from "domain/entities/Async";
import { MetadataObject } from "domain/entities/MetadataObject";

export interface MetadataRepository {
    get(models: string[]): Async<MetadataObject[]>;
    save(objects: MetadataObject[], options: SaveOptions): Async<Payload>;
}

export type Payload = object;

export interface SaveOptions {
    dryRun: boolean;
}
