import _ from "lodash";
import { command, string, subcommands, positional, flag } from "cmd-ts";
import { getApiUrlOption, getD2Api } from "scripts/common";
import { TranslateDataElementsFormNameUseCase } from "domain/usecases/TranslateDataElementsFormNameUseCase";
import { DataElementsD2Repository } from "data/DataElementsD2Repository";
import { FieldTranslationsSpreadsheetRepository } from "data/FieldTranslationsSpreadsheetRepository";
import log from "utils/log";
import { LocalesD2Repository } from "data/LocalesD2Repository";

export function getCommand() {
    const translatedFormNameCmd = command({
        name: "translate-formname",
        description: "Translate data elements formName field",
        args: {
            url: getApiUrlOption({ long: "url" }),
            post: flag({
                long: "post",
                description: "Post changes",
            }),
            inputFile: positional({
                type: string,
                displayName: "INPUT_XLSX_PATH",
                description: "Input xlsx file (expected headers: name,formName,Locale1,Locale2,...) ",
            }),
        },
        handler: async args => {
            const api = getD2Api(args.url);
            const dataElementsRepository = new DataElementsD2Repository(api);
            const localesRepository = new LocalesD2Repository(api);
            const fieldTranslationsRepository = new FieldTranslationsSpreadsheetRepository();

            await new TranslateDataElementsFormNameUseCase(
                dataElementsRepository,
                localesRepository,
                fieldTranslationsRepository
            ).execute(args);

            if (!args.post) {
                log.info(`Add option --post to save the payload`);
            }
        },
    });

    return subcommands({
        name: "datasets",
        cmds: { "translate-formname": translatedFormNameCmd },
    });
}
