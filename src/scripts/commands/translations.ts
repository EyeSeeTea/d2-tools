import _ from "lodash";
import log from "utils/log";
import { command, string, subcommands, positional, flag, option, optional } from "cmd-ts";
import { getApiUrlOption, getD2Api } from "scripts/common";
import { TranslateMetadataUseCase } from "domain/usecases/TranslateMetadataUseCase";
import { LocalesD2Repository } from "data/LocalesD2Repository";
import { ImportTranslationsRepositorySpreadsheetRepository } from "data/ImportTranslationsRepositorySpreadsheetRepository";
import { MetadataD2Repository } from "data/MetadataD2Repository";

export function getCommand() {
    const translateFromSpreadsheetCmd = command({
        name: "from-spreadsheet",
        description: "Create translations for metadata objects",
        args: {
            url: getApiUrlOption({ long: "url" }),
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
            const api = getD2Api(args.url);

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

    return subcommands({
        name: "translations",
        cmds: { "from-spreadsheet": translateFromSpreadsheetCmd },
    });
}
