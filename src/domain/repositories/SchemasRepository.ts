import { Async } from "domain/entities/Async";
import { MetadataModel } from "domain/entities/MetadataObject";
import { TranslatableField } from "domain/entities/Translation";

export interface SchemasRepository {
    /* Translatable fields of each model, keyed by plural model name. */
    getTranslatableFields(): Async<Record<MetadataModel, TranslatableField[]>>;
}
