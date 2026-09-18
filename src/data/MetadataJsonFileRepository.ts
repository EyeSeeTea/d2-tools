import _ from "lodash";
import fs from "fs";
import { Async } from "domain/entities/Async";
import { MetadataModel, MetadataObjectWithTranslations } from "domain/entities/MetadataObject";
import {
    GetTranslationsOptions,
    MetadataSourceRepository,
} from "domain/repositories/MetadataSourceRepository";
import { buildDataSetScope, isInDataSetScope } from "domain/entities/DataSetScope";
import { getPluralModel } from "./dhis2-utils";
import { Translation } from "domain/entities/Translation";

/* Metadata objects read from a DHIS2 metadata JSON export ({ dataElements: [...], ... }),
   for example a package to be deployed that is not yet in any trusted instance. */
export class MetadataJsonFileRepository implements MetadataSourceRepository {
    constructor(private path: string) {}

    async getAllWithTranslations(
        models: MetadataModel[],
        options: GetTranslationsOptions = {}
    ): Async<MetadataObjectWithTranslations[]> {
        if (options.programId) throw new Error("programId is not supported for a metadata file");

        const metadata = this.read();
        const objects = this.getObjects(metadata, models);

        if (!options.dataSetId) {
            return objects;
        } else {
            // A file has no dependency export: scope by membership, using its data sets.
            const dataSets = this.getObjects(metadata, ["dataSets"]);
            const dataElements = this.getObjects(metadata, ["dataElements"]);
            const scope = buildDataSetScope([options.dataSetId], dataSets, dataElements);
            if (!dataSets.some(dataSet => dataSet.id === options.dataSetId))
                throw new Error(`Data set not found in ${this.path}: ${options.dataSetId}`);

            return objects.filter(object => isInDataSetScope(object, scope));
        }
    }

    private getObjects(metadata: MetadataFile, models: MetadataModel[]): MetadataObjectWithTranslations[] {
        return _(models)
            .map(getPluralModel)
            .flatMap(model =>
                (metadata[model] ?? []).map(
                    (object): MetadataObjectWithTranslations => ({
                        ...object,
                        model: model,
                        code: object.code,
                        translations: object.translations ?? [],
                    })
                )
            )
            .value();
    }

    private read(): MetadataFile {
        const contents = fs.readFileSync(this.path, "utf8");
        const json = JSON.parse(contents) as unknown;

        if (!_.isPlainObject(json)) throw new Error(`Not a metadata JSON object: ${this.path}`);

        return _.pickBy(json as Record<string, unknown>, _.isArray) as MetadataFile;
    }
}

type MetadataFile = Record<MetadataModel, Array<MetadataFileObject>>;

interface MetadataFileObject {
    id: string;
    name: string;
    code?: string;
    translations?: Translation[];
}
