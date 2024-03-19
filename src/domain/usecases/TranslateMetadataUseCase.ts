import _ from "lodash";
import fs from "fs";
import { Async } from "domain/entities/Async";
import { MetadataRepository } from "domain/repositories/MetadataRepository";
import { ImportTranslationsRepository } from "domain/repositories/ImportTranslationsRepository";
import { Translation } from "domain/entities/Translation";
import log from "utils/log";
import { FieldTranslations } from "domain/entities/FieldTranslations";
import { LocalesRepository } from "domain/repositories/LocalesRepository";
import { MetadataObjectWithTranslations } from "domain/entities/MetadataObject";
import { Maybe } from "utils/ts-utils";
import { getId } from "domain/entities/Base";

interface Options {
    inputFile: string;
    savePayload?: string;
    post: boolean;
}

export class TranslateMetadataUseCase {
    constructor(
        private repositories: {
            metadata: MetadataRepository;
            locales: LocalesRepository;
            importTranslations: ImportTranslationsRepository;
        }
    ) {}

    async execute(options: Options): Async<void> {
        const { savePayload: saveToFile } = options;
        const objectsToPost = await this.getObjectsToPost(options);
        log.info(`Payload: ${objectsToPost.length} objects`);
        const dryRun = !options.post;

        const { stats, payload } = await this.repositories.metadata.save(objectsToPost, { dryRun });
        const message = dryRun ? `POST (dryRun=true)` : "POST";
        log.info(`${message}: ${JSON.stringify(stats)}`);

        if (saveToFile) {
            log.info(`Payload saved: ${saveToFile}`);
            const contents = JSON.stringify(payload, null, 4);
            fs.writeFileSync(saveToFile, contents);
        }
    }

    private async getObjectsToPost(options: Options) {
        const locales = await this.repositories.locales.get();

        const fieldTranslations = await this.repositories.importTranslations.get({
            inputFile: options.inputFile,
            locales: locales,
        });

        const models = _(fieldTranslations)
            .map(o => o.model)
            .uniq()
            .value();

        const objects = await this.repositories.metadata.getAllWithTranslations(models);
        const objectsWithTranslations = this.addTranslations(objects, fieldTranslations);
        const objectsWithChanges = _.differenceWith(objectsWithTranslations, objects, _.isEqual);

        return objectsWithChanges;
    }

    private addTranslations(
        objects: MetadataObjectWithTranslations[],
        fieldTranslations: FieldTranslations
    ): MetadataObjectWithTranslations[] {
        const objectsById = _.keyBy(objects, obj => `${obj.model}:${obj.id}`);
        const objectsByCode = _.keyBy(objects, obj => `${obj.model}:${obj.code}`);
        const objectsByNameCI = _.keyBy(objects, obj => `${obj.model}:${obj.name?.toLowerCase()}`);

        const objectsUpdated = _(fieldTranslations)
            .map((fieldTranslation): Maybe<MetadataObjectWithTranslations> => {
                const get = (mapping: Record<string, MetadataObjectWithTranslations>, value: Maybe<string>) =>
                    value ? mapping[`${fieldTranslation.model}:${value}`] : undefined;

                const { identifier } = fieldTranslation;

                const object =
                    get(objectsById, identifier.id) ||
                    get(objectsByCode, identifier.code) ||
                    get(objectsByNameCI, identifier.name?.toLocaleLowerCase());

                if (!object) {
                    log.warn(`Object not found: ${fieldTranslation.model}:${JSON.stringify(identifier)}`);
                    return undefined;
                } else {
                    return {
                        ...object,
                        translations: this.mergeTranslations(
                            object.translations,
                            fieldTranslation.translations
                        ),
                    };
                }
            })
            .compact()
            .sortBy(getId)
            .value();

        return objectsUpdated;
    }

    private mergeTranslations(translations1: Translation[], translations2: Translation[]): Translation[] {
        // Locales may have LANGUAGE or LANGUAGE_COUNTRY, considered them equal if language is equal
        return _(translations1)
            .map(translation1 => {
                const translation2 = translations2.find(t2 => {
                    return translation1.locale === t2.locale && translation1.property === t2.property;
                });
                return translation2 || translation1;
            })
            .concat(translations2)
            .uniqBy(translation => [translation.locale, translation.property].join("."))
            .value();
    }
}
