import _ from "lodash";
import { command, string, number, option, flag } from "cmd-ts";
import { getApiUrlOptions, getD2ApiFromArgs } from "scripts/common";
import { OptionD2Repository } from "data/OptionD2Repository";
import { RenameOptionCodeUseCase } from "domain/usecases/RenameOptionCodeUseCase";
import { ValidateOptionSetsUseCase } from "domain/usecases/ValidateOptionSetsUseCase";
import { OptionSetD2Repository } from "data/OptionSetD2Repository";
import { OptionReport } from "./OptionReport";
import logger from "utils/log";
import { DEFAULT_VALID_LENGTH } from "domain/entities/Option";

export const renameCodeCmd = command({
    name: "rename",
    description: "Rename option code (metadata and associated data values)",
    args: {
        ...getApiUrlOptions(),
        optionId: option({ type: string, long: "id", defaultValue: () => "" }),
        toCode: option({ type: string, long: "to-code", defaultValue: () => "" }),
        post: flag({ long: "post", description: "Persist changes", defaultValue: () => false }),
        analyze: flag({
            long: "analyze",
            description: "analyze option codes and generate a csv report",
            defaultValue: () => false,
        }),
        reportPath: option({
            type: string,
            long: "report-path",
            description: "Path to save the report",
            defaultValue: () => "option-report.csv",
        }),
        codeLength: option({
            type: number,
            long: "code-length",
            description: "Max length of the code for it to be considered valid",
            defaultValue: () => DEFAULT_VALID_LENGTH,
        }),
    },
    handler: async args => {
        const api = getD2ApiFromArgs(args);
        if (args.analyze && args.reportPath) {
            const optionSetRepository = new OptionSetD2Repository(api);
            const validationResult = await new ValidateOptionSetsUseCase(optionSetRepository).execute({
                codeLength: args.codeLength,
            });
            if (validationResult.length > 0) {
                await new OptionReport().generateReport(validationResult, args.reportPath);
            } else {
                logger.info("No invalid options found");
            }
        }

        if (args.optionId && args.toCode) {
            const optionRepository = new OptionD2Repository(api);
            await new RenameOptionCodeUseCase(optionRepository).execute(args);
        } else {
            logger.info(
                `Provide a valid option ID and a new code to rename the option: --id <optionId> --to-code <newCode>`
            );
        }
    },
});
