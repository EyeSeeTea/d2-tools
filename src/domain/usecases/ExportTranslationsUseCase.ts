import _ from "lodash";
import { Async } from "domain/entities/Async";
import { Locale } from "domain/entities/Locale";
import { MetadataRepository } from "domain/repositories/MetadataRepository";
import { LocalesRepository } from "domain/repositories/LocalesRepository";
import { ExportTranslationsRepository } from "domain/repositories/ExportTranslationsRepository";
import { ModelTranslationsExport } from "domain/entities/ModelTranslationsExport";
import { getPluralModel } from "data/dhis2-utils";
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
        const { outputFile, models, includeData } = options;
        const allLocales = await this.repositories.locales.get();
        const locales = this.resolveLocales(allLocales, options.locales);

        const sheets = await Promise.all(
            models.map(async (selection): Promise<ModelTranslationsExport> => {
                const model = getPluralModel(selection.model);
                const objects = await this.repositories.metadata.getAllWithTranslations([model]);

                log.info(`${model}: ${objects.length} objects`);

                return { model, fields: selection.fields, locales, objects };
            })
        );

        await this.repositories.exportTranslations.save({ outputFile, sheets, includeData });
    }

    /* Match requested locale names against DB locales, ignoring any " (...)" suffix and case
       (mirrors the import matching). Example: "Spanish" matches "Spanish (Spain)". */
    private resolveLocales(dbLocales: Locale[], requestedNames: string[]): Locale[] {
        const stripName = (name: string) =>
            name
                .replace(/\s*\(.*\)$/, "")
                .trim()
                .toLowerCase();
        const localesByName = _.keyBy(dbLocales, locale => stripName(locale.name));

        return _(requestedNames)
            .map(name => {
                const locale = localesByName[stripName(name)];
                if (!locale) log.warn(`Locale not found in DB: ${name}`);
                return locale;
            })
            .compact()
            .value();
    }
}
