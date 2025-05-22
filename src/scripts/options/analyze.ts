import _ from "lodash";
import { command, string, number, option, flag, boolean } from "cmd-ts";
import { getApiUrlOptions, getD2ApiFromArgs } from "scripts/common";
import { ValidateOptionSetsUseCase } from "domain/usecases/ValidateOptionSetsUseCase";
import { OptionSetD2Repository } from "data/OptionSetD2Repository";
import { OptionReport } from "./OptionReport";
import logger from "utils/log";
import { DEFAULT_VALID_LENGTH } from "domain/entities/Option";
import { OptionD2Repository } from "data/OptionD2Repository";

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
        update: flag({
            long: "update",
            description: "Persist changes",
            defaultValue: () => false,
            type: boolean,
        }),
    },
    handler: async args => {
        const api = getD2ApiFromArgs(args);
        const optionSetRepository = new OptionSetD2Repository(api);
        const optionRepository = new OptionD2Repository(api);

        const validationResults = await new ValidateOptionSetsUseCase(
            optionSetRepository,
            optionRepository
        ).execute(args);

        if (validationResults.length > 0) {
            await new OptionReport().generateReport(validationResults, args.reportPath);
            process.exit(1);
        } else {
            logger.info("No invalid options found");
        }
    },
});
