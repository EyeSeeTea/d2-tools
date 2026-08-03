import _ from "lodash";
import { Async } from "domain/entities/Async";
import { Locale } from "domain/entities/Locale";
import { MetadataRepository } from "domain/repositories/MetadataRepository";
import { LocalesRepository } from "domain/repositories/LocalesRepository";
import { ExportTranslationsRepository } from "domain/repositories/ExportTranslationsRepository";
import { ModelTranslationsExport } from "domain/entities/ModelTranslationsExport";
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
    programId?: string; // when set, scope the export to this program's metadata dependency export
}

export class ExportTranslationsUseCase {
    constructor(
        private repositories: {
            metadata: MetadataRepository;
            locales: LocalesRepository;
            exportTranslations: ExportTranslationsRepository;
        }
    ) {}

    async execute(options: Options): Async<void> {
        const { outputFile, models, includeData, programId } = options;
        const allLocales = await this.repositories.locales.get();
        const locales = this.resolveLocales(allLocales, options.locales);

        const sheets = await Promise.all(
            models.map(async (selection): Promise<ModelTranslationsExport> => {
                const model = getPluralModel(selection.model);
                const objects = await this.repositories.metadata.getAllWithTranslations([model], {
                    programId,
                });

                log.info(`${model}: ${objects.length} objects`);

                return { model, fields: selection.fields, locales, objects };
            })
        );

        await this.repositories.exportTranslations.save({ outputFile, sheets, includeData });
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

/* Drop a trailing " (...)" country/variant qualifier, keeping the original case. */
function stripLocaleSuffix(name: string): string {
    return name.replace(/\s*\(.*\)$/, "").trim();
}

function normalizeLocaleName(name: string): string {
    return stripLocaleSuffix(name).toLowerCase();
}
