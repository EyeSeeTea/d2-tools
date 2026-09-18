import _ from "lodash";
import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { Locale, LocaleCode } from "domain/entities/Locale";
import { MetadataRepository } from "domain/repositories/MetadataRepository";
import { MetadataSourceRepository } from "domain/repositories/MetadataSourceRepository";
import { LocalesRepository } from "domain/repositories/LocalesRepository";
import { ExportTranslationsRepository } from "domain/repositories/ExportTranslationsRepository";
import { ModelTranslationsExport } from "domain/entities/ModelTranslationsExport";
import {
    getMetadataObjectField,
    getMetadataObjectTranslation,
    MetadataObjectWithTranslations,
} from "domain/entities/MetadataObject";
import { getPluralModel } from "data/dhis2-utils";
import { Maybe } from "utils/ts-utils";
import log from "utils/log";

export interface ModelSelection {
    model: string; // singular or plural, as provided
    fields: string[]; // translatable fields, e.g. ["name", "formName"]
}

interface Options {
    outputFile: string;
    models: ModelSelection[];
    locales: string[]; // locale names, e.g. ["Spanish", "French"]
    includeData: boolean;
    programIds?: Id[]; // when set, scope the export to these programs' objects
    dataSetIds?: Id[]; // when set, scope the export to these data sets' objects
    onlyChanged?: boolean; // keep only objects new or changed with respect to the instance
    defaultLocale?: LocaleCode; // onlyChanged also compares this locale's translations (ex: "en")
    excludeNames?: RegExp; // drop objects whose name matches (ex: /^\[DEPRECATED\]/)
}

export class ExportTranslationsUseCase {
    constructor(
        private repositories: {
            metadata: MetadataRepository; // the instance: locales and reference for onlyChanged
            metadataSource?: MetadataSourceRepository; // objects to export (default: the instance)
            locales: LocalesRepository;
            exportTranslations: ExportTranslationsRepository;
        }
    ) {}

    async execute(options: Options): Async<void> {
        const { outputFile, models, includeData, programIds, dataSetIds } = options;
        if (!_.isEmpty(programIds) && !_.isEmpty(dataSetIds))
            throw new Error("Options programIds and dataSetIds are exclusive");
        const allLocales = await this.repositories.locales.get();
        const locales = this.resolveLocales(allLocales, options.locales);

        const sheets = await Promise.all(
            models.map(async (selection): Promise<ModelTranslationsExport> => {
                const model = getPluralModel(selection.model);
                const objects = await this.getObjects(model, selection.fields, options);

                return { model, fields: selection.fields, locales, objects };
            })
        );

        await this.repositories.exportTranslations.save({ outputFile, sheets, includeData });
    }

    private async getObjects(
        model: string,
        fields: string[],
        options: Options
    ): Async<MetadataObjectWithTranslations[]> {
        const { programIds, dataSetIds, excludeNames } = options;
        const source = this.repositories.metadataSource ?? this.repositories.metadata;
        const allObjects = await source.getAllWithTranslations([model], { programIds, dataSetIds });
        const objects = excludeNames
            ? allObjects.filter(object => !excludeNames.test(object.name))
            : allObjects;

        if (!options.onlyChanged) {
            log.info(`${model}: ${objects.length} objects`);
            return objects;
        } else {
            const ids = objects.map(object => object.id);
            const referenceObjects = await this.repositories.metadata.getByIdsWithTranslations(model, ids);
            const referenceById = _.keyBy(referenceObjects, object => object.id);

            const changed = objects.filter(object =>
                isChanged(object, referenceById[object.id], fields, options.defaultLocale)
            );

            log.info(`${model}: ${objects.length} objects, ${changed.length} new or changed`);
            return changed;
        }
    }

    /* Resolve each requested name to a DB locale, allowing short references. The resolved locale's
       name is stripped of its " (...)" suffix so the column header round-trips with the import
       (which matches headers against suffix-stripped DB names). */
    private resolveLocales(dbLocales: Locale[], requestedNames: string[]): Locale[] {
        return _(requestedNames)
            .map(name => this.resolveLocale(dbLocales, name))
            .compact()
            .value();
    }

    /* Match one requested name against DB locales, ignoring case and any " (...)" suffix. An exact
       base-name match wins; otherwise fall back to a substring match, so "Sotho" resolves to
       "Southern Sotho (Lesotho)". A substring matching more than one locale is ambiguous and errors;
       no match warns and is skipped. Example: "Spanish" matches "Spanish (Spain)". */
    private resolveLocale(dbLocales: Locale[], requestedName: string): Maybe<Locale> {
        const target = normalizeLocaleName(requestedName);
        if (!target) return undefined;

        const exact = dbLocales.filter(locale => normalizeLocaleName(locale.name) === target);
        const matches =
            exact.length > 0
                ? exact
                : dbLocales.filter(locale => normalizeLocaleName(locale.name).includes(target));

        if (matches.length === 0) {
            log.warn(`Locale not found in DB: ${requestedName}`);
            return undefined;
        } else if (matches.length > 1) {
            const names = matches.map(locale => locale.name).join(", ");
            throw new Error(`Ambiguous locale "${requestedName}", matches ${matches.length}: ${names}`);
        }

        const locale = matches[0]!;
        return { ...locale, name: stripLocaleSuffix(locale.name) };
    }
}

/* An object needs (re)translation when it does not exist in the reference, or when any of the
   selected fields differs, or when the default-locale translation of a selected field differs
   (the label users see may be changed only through that translation). */
export function isChanged(
    object: MetadataObjectWithTranslations,
    reference: Maybe<MetadataObjectWithTranslations>,
    fields: string[],
    defaultLocale: Maybe<LocaleCode>
): boolean {
    if (!reference) return true;

    const fieldValue = (obj: MetadataObjectWithTranslations, field: string) =>
        getMetadataObjectField(obj, field).trim();
    const defaultTranslation = (obj: MetadataObjectWithTranslations, field: string) =>
        defaultLocale ? getMetadataObjectTranslation(obj, field, defaultLocale)?.trim() ?? "" : "";

    return fields.some(
        field =>
            fieldValue(object, field) !== fieldValue(reference, field) ||
            defaultTranslation(object, field) !== defaultTranslation(reference, field)
    );
}

/* Drop a trailing " (...)" country/variant qualifier, keeping the original case. */
function stripLocaleSuffix(name: string): string {
    return name.replace(/\s*\(.*\)$/, "").trim();
}

function normalizeLocaleName(name: string): string {
    return stripLocaleSuffix(name).toLowerCase();
}
