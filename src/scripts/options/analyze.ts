import _ from "lodash";
import { command, string, number, option } from "cmd-ts";
import { getApiUrlOptions, getD2ApiFromArgs } from "scripts/common";
import { ValidateOptionSetsUseCase } from "domain/usecases/ValidateOptionSetsUseCase";
import { OptionSetD2Repository } from "data/OptionSetD2Repository";
import { OptionReport } from "./OptionReport";
import logger from "utils/log";
import { DEFAULT_VALID_LENGTH } from "domain/entities/Option";

export const analyzeOptionsCmd = command({
    name: "analyze",
    description: "Analyze option codes and names",
    args: {
        ...getApiUrlOptions(),
        reportPath: option({
            type: string,
            long: "report-path",
            description: "Path to save the report",
            defaultValue: () => "option-report.csv",
        }),
        lengthToValidate: option({
            type: number,
            long: "length",
            description: "Max length of the code/name for it to be considered valid",
            defaultValue: () => DEFAULT_VALID_LENGTH,
        }),
    },
    handler: async args => {
        const api = getD2ApiFromArgs(args);
        const optionSetRepository = new OptionSetD2Repository(api);

        const validationResult = await new ValidateOptionSetsUseCase(optionSetRepository).execute({
            lengthToValidate: args.lengthToValidate,
        });

        if (validationResult.length > 0) {
            await new OptionReport().generateReport(validationResult, args.reportPath);
            process.exit(1);
        } else {
            logger.info("No invalid options found");
        }
    },
});
