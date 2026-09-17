import _ from "lodash";
import fs from "fs";
import { Async } from "domain/entities/Async";
import { MetadataRepository } from "domain/repositories/MetadataRepository";
import { ImportTranslationsRepository } from "domain/repositories/ImportTranslationsRepository";
import { TranslatableField, Translation, uniqueTranslatableFields } from "domain/entities/Translation";
import log from "utils/log";
import { FieldTranslations } from "domain/entities/FieldTranslations";
import { LocalesRepository } from "domain/repositories/LocalesRepository";
import { SchemasRepository } from "domain/repositories/SchemasRepository";
import { DataSetsRepository } from "domain/repositories/DataSetsRepository";
import { ProgramsRepository } from "domain/repositories/ProgramsRepository";
import { MetadataModel, MetadataObjectWithTranslations } from "domain/entities/MetadataObject";
import { Maybe } from "utils/ts-utils";
import { getId, Id } from "domain/entities/Base";
import { LocaleCode } from "domain/entities/Locale";

interface Options {
    inputFile: string;
    savePayload?: string;
    post: boolean;
    defaultLocale: Maybe<LocaleCode>;
    bumpVersions: boolean;
}

export class TranslateMetadataUseCase {
    constructor(
        private repositories: {
            metadata: MetadataRepository;
            locales: LocalesRepository;
            schemas: SchemasRepository;
            importTranslations: ImportTranslationsRepository;
            dataSets: DataSetsRepository;
            programs: ProgramsRepository;
        }
    ) {}

    async execute(options: Options): Async<void> {
        const { savePayload: saveToFile } = options;
        const objectsToPost = await this.getObjectsToPost(options);
        log.info(`Objects with changes: ${objectsToPost.length}`);
        const dryRun = !options.post;

        const { stats, payload } = await this.repositories.metadata.save(objectsToPost, { dryRun });
        const message = dryRun ? `POST (dryRun=true)` : "POST";
        log.info(`${message}: ${JSON.stringify(stats)}`);

        if (saveToFile) {
            log.info(`Payload saved: ${saveToFile}`);
            const contents = JSON.stringify(payload, null, 4);
            fs.writeFileSync(saveToFile, contents);
        }

        if (options.bumpVersions) await this.bumpVersions(objectsToPost, options);
    }

    /* The Capture apps cache the metadata of each data set/program and refresh it only when its
       version changes, so a translation update stays invisible until the data sets/programs using
       the changed data elements are bumped. Posted separately, so --save-payload does not show it. */
    private async bumpVersions(objects: MetadataObjectWithTranslations[], options: Options): Async<void> {
        const dataElementIds = new Set(objects.filter(object => object.model === "dataElements").map(getId));

        if (_.isEmpty(dataElementIds)) return;

        const [dataSets, programs] = await Promise.all([
            this.repositories.dataSets.getAll(),
            this.repositories.programs.get({}),
        ]);

        const dataSetsToBump = dataSets.filter(dataSet =>
            dataSet.dataSetElements.some(({ dataElement }) => dataElementIds.has(dataElement.id))
        );

        const programsToBump = programs.filter(program =>
            program.programStages.some(programStage =>
                programStage.programStageDataElements.some(({ dataElement }) =>
                    dataElementIds.has(dataElement.id)
                )
            )
        );

        const dataSetsBumped = dataSetsToBump.map(dataSet => bumpVersion(dataSet, "dataSets"));
        const programsBumped = programsToBump.map(program => bumpVersion(program, "programs"));

        if (!options.post) {
            log.info(`Versions not bumped (dryRun=true). Add option --post to persist`);
            return;
        }

        if (!_.isEmpty(dataSetsBumped)) {
            const result = await this.repositories.dataSets.post({ dataSets: dataSetsBumped });
            if (result === "ERROR") throw new Error("Error while posting the dataSets");
        }

        if (!_.isEmpty(programsBumped)) {
            await this.repositories.programs.save(programsBumped);
        }
    }

    private async getObjectsToPost(options: Options) {
        const [locales, translatableFieldsByModel] = await Promise.all([
            this.repositories.locales.get(),
            this.repositories.schemas.getTranslatableFields(),
        ]);

        const fieldTranslations = await this.repositories.importTranslations.get({
            inputFile: options.inputFile,
            locales: locales,
            defaultLocale: options.defaultLocale,
            translatableFields: translatableFieldsByModel,
        });

        this.validateFields(fieldTranslations, translatableFieldsByModel);
        this.logFieldUpdates(fieldTranslations);

        const models = _(fieldTranslations)
            .map(o => o.model)
            .uniq()
            .value();

        const objects = await this.repositories.metadata.getAllWithTranslations(models);
        const objectsWithTranslations = this.addTranslations(objects, fieldTranslations);
        const objectsWithChanges = _.differenceWith(objectsWithTranslations, objects, _.isEqual);
        log.info(`Objects with translations: ${objectsWithTranslations.length}`);

        return objectsWithChanges;
    }

    /* Warn about columns whose field the instance does not consider translatable (DHIS2 ignores
       unknown properties, so those columns would silently do nothing) and about columns writing
       unique-constrained fields. One warning per model/field, not per row. */
    private validateFields(
        fieldTranslations: FieldTranslations,
        translatableFieldsByModel: Record<MetadataModel, TranslatableField[]>
    ): void {
        const usages = _(fieldTranslations)
            .flatMap(({ model, fields, translations }) => {
                const fromFields = _.keys(fields).map(field => ({ model, field, isFieldValue: true }));
                // "FORM_NAME" -> "formName", back to the field the column refers to.
                const fromTranslations = translations.map(translation => ({
                    model: model,
                    field: _.camelCase(translation.property),
                    isFieldValue: false,
                }));
                return [...fromFields, ...fromTranslations];
            })
            .uniqBy(usage => [usage.model, usage.field, usage.isFieldValue].join("."))
            .value();

        usages.forEach(({ model, field, isFieldValue }) => {
            // An unknown model is already reported by the object lookup, don't warn twice.
            const translatableFields: Maybe<TranslatableField[]> = translatableFieldsByModel[model];

            if (translatableFields && !translatableFields.includes(field)) {
                log.warn(`Field not translatable, column ignored: ${model}.${field}`);
            } else if (isFieldValue && uniqueTranslatableFields.includes(field)) {
                log.warn(
                    `Writing the unique field ${model}.${field}: ` +
                        `duplicated values will make the import fail`
                );
            }
        });
    }

    /* Field updates go beyond translations, make them visible in the (dry) run output. */
    private logFieldUpdates(fieldTranslations: FieldTranslations): void {
        _(fieldTranslations)
            .filter(({ fields }) => !_.isEmpty(fields))
            .groupBy(({ model }) => model)
            .forEach((group, model) => {
                const fields = _(group)
                    .flatMap(({ fields }) => _.keys(fields))
                    .uniq()
                    .sort()
                    .join(", ");
                log.info(`${model}: ${group.length} rows update fields [${fields}]`);
            });
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
                        ...fieldTranslation.fields,
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

/* Objects never versioned have no version, start them at 1. */
function bumpVersion<Obj extends { id: Id; name: string; version: Maybe<number> }>(
    object: Obj,
    model: string
): Obj {
    const version = (object.version ?? 0) + 1;
    log.info(`Bump version ${model}:${object.id} (${object.name}): ${object.version ?? "-"} -> ${version}`);

    return { ...object, version };
}
