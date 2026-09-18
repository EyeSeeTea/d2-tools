import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { MetadataModel, MetadataObjectWithTranslations } from "domain/entities/MetadataObject";

/* Read-only source of metadata objects with their translations: a DHIS2 instance or a
   metadata JSON export. */
export interface MetadataSourceRepository {
    getAllWithTranslations(
        models: MetadataModel[],
        options?: GetTranslationsOptions
    ): Async<MetadataObjectWithTranslations[]>;
}

/* When programId/dataSetId is set, only the objects belonging to that program/data set are
   returned: from its metadata dependency export (/api/programs/{id}/metadata,
   /api/dataSets/{id}/metadata) for an instance, by membership for a metadata file. */
export interface GetTranslationsOptions {
    programId?: Id;
    dataSetId?: Id;
}
