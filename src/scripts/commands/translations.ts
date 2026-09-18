import _ from "lodash";
import log from "utils/log";
import { command, string, subcommands, positional, flag, option, optional, Type } from "cmd-ts";
import { getApiUrlOptions, getD2ApiFromArgs, IdsSeparatedByCommas } from "scripts/common";
import { TranslateMetadataUseCase } from "domain/usecases/TranslateMetadataUseCase";
import { ExportTranslationsUseCase, ModelSelection } from "domain/usecases/ExportTranslationsUseCase";
import { LocalesD2Repository } from "data/LocalesD2Repository";
import { ImportTranslationsRepositorySpreadsheetRepository } from "data/ImportTranslationsRepositorySpreadsheetRepository";
import { ExportTranslationsSpreadsheetRepository } from "data/ExportTranslationsSpreadsheetRepository";
import { MetadataD2Repository } from "data/MetadataD2Repository";
import { MetadataJsonFileRepository } from "data/MetadataJsonFileRepository";

export function getCommand() {
    const translateFromSpreadsheetCmd = command({
        name: "from-spreadsheet",
        description: "Create translations for metadata objects",
        args: {
            ...getApiUrlOptions(),
            post: flag({
                long: "post",
                description: "Post changes",
            }),
            savePayload: option({
                type: optional(string),
                long: "save-payload",
                description: "Save JSON payload to file",
            }),
            inputFile: positional({
                type: string,
                displayName: "INPUT_XLSX_PATH",
                description: "Input xlsx file (expected headers: name,formName,Locale1,Locale2,...) ",
            }),
        },
        handler: async args => {
            const api = getD2ApiFromArgs(args);

            const repositories = {
                metadata: new MetadataD2Repository(api),
                locales: new LocalesD2Repository(api),
                importTranslations: new ImportTranslationsRepositorySpreadsheetRepository(),
            };
            await new TranslateMetadataUseCase(repositories).execute(args);

            if (!args.post) {
                log.info(`Metadata not posted to the server. Add option --post to persist`);
            }
        },
    });

    const translateToSpreadsheetCmd = command({
        name: "to-spreadsheet",
        description: "Generate a translations spreadsheet from metadata objects",
        args: {
            ...getApiUrlOptions(),
            models: option({
                type: ModelsType,
                long: "models",
                description:
                    "Models to export, comma-separated, each with its translatable fields: " +
                    "model[field1,field2]. Example: dataElements[name,formName],indicators[name]",
            }),
            locales: option({
                type: string,
                long: "locales",
                description: "Locales to include as columns, comma-separated. Example: Spanish,French",
            }),
            programIds: option({
                type: optional(IdsSeparatedByCommas),
                long: "program-ids",
                description:
                    "Scope the export to the metadata dependency export of these programs " +
                    "(/api/programs/{id}/metadata, comma-separated IDs) instead of the whole instance",
            }),
            dataSetIds: option({
                type: optional(IdsSeparatedByCommas),
                long: "data-set-ids",
                description:
                    "Scope the export to the metadata dependency export of these data sets " +
                    "(/api/dataSets/{id}/metadata, comma-separated IDs) instead of the whole " +
                    "instance. With --metadata-file, to the objects of the file belonging to them",
            }),
            includeData: flag({
                long: "include-data",
                description:
                    "Write one row per object with source values and existing translations. " +
                    "When omitted, only the header row is written (a column template).",
            }),
            metadataFile: option({
                type: optional(string),
                long: "metadata-file",
                description:
                    "Read the objects from a DHIS2 metadata JSON export instead of the instance " +
                    "(--url is still used for the locales and as reference for --only-changed)",
            }),
            onlyChanged: flag({
                long: "only-changed",
                description:
                    "Export only the objects of --metadata-file that do not exist in the instance " +
                    "or whose selected fields (or their --default-locale translation) differ",
            }),
            defaultLocale: option({
                type: optional(string),
                long: "default-locale",
                description:
                    "Locale code of the default (DB) language, used by --only-changed to also " +
                    "detect changes in its translations. Matched by language. Example: en",
            }),
            excludeNames: option({
                type: optional(RegExpType),
                long: "exclude-names",
                description: "Skip objects whose name matches this regex. Example: '^\\[DEPRECATED\\]'",
            }),
            outputFile: positional({
                type: string,
                displayName: "OUTPUT_XLSX_PATH",
                description: "Output xlsx file",
            }),
        },
        handler: async args => {
            const api = getD2ApiFromArgs(args);

            if (args.onlyChanged && !args.metadataFile)
                throw new Error("--only-changed requires --metadata-file");

            const repositories = {
                metadata: new MetadataD2Repository(api),
                metadataSource: args.metadataFile
                    ? new MetadataJsonFileRepository(args.metadataFile)
                    : undefined,
                locales: new LocalesD2Repository(api),
                exportTranslations: new ExportTranslationsSpreadsheetRepository(),
            };

            await new ExportTranslationsUseCase(repositories).execute({
                outputFile: args.outputFile,
                models: args.models,
                locales: parseList(args.locales),
                includeData: args.includeData,
                programIds: args.programIds,
                dataSetIds: args.dataSetIds,
                onlyChanged: args.onlyChanged,
                defaultLocale: args.defaultLocale,
                excludeNames: args.excludeNames,
            });
        },
    });

    return subcommands({
        name: "translations",
        cmds: {
            "from-spreadsheet": translateFromSpreadsheetCmd,
            "to-spreadsheet": translateToSpreadsheetCmd,
        },
    });
}

/* Parse a comma-separated list, trimming and dropping empty values. */
function parseList(input: string): string[] {
    return _(input.split(","))
        .map(value => value.trim())
        .compact()
        .value();
}

/* Parse "dataElements[name,formName],indicators[name]" into [{ model, fields }, ...]. */
export function parseModels(input: string): ModelSelection[] {
    const regex = /([a-zA-Z][\w]*)(?:\[([^\]]*)\])?/g;

    return _(Array.from(input.matchAll(regex)))
        .map(match => {
            const model = match[1];
            if (!model) return undefined;
            const fields = _((match[2] ?? "").split(","))
                .map(field => field.trim())
                .compact()
                .value();
            return { model, fields };
        })
        .compact()
        .value();
}

/* Parse and validate the --models option: every model must specify its translatable fields. */
export function parseModelsOption(input: string): ModelSelection[] {
    const selections = parseModels(input);

    if (selections.length === 0) throw new Error("No models provided");

    const withoutFields = selections.filter(selection => _.isEmpty(selection.fields));
    if (!_.isEmpty(withoutFields)) {
        const models = withoutFields.map(selection => selection.model).join(", ");
        throw new Error(
            `Missing translatable fields for: ${models}. ` +
                `Specify them as model[field1,field2], e.g. indicators[name,shortName]`
        );
    }

    return selections;
}

/* cmd-ts type for regex options. */
const RegExpType: Type<string, RegExp> = {
    async from(input) {
        return new RegExp(input);
    },
};

/* cmd-ts type for --models: parses the string and requires every model to specify its fields. */
const ModelsType: Type<string, ModelSelection[]> = {
    async from(input) {
        return parseModelsOption(input);
    },
};
