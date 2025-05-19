import fs from "fs/promises";
import { createArrayCsvStringifier } from "csv-writer";
import _ from "lodash";
import logger from "utils/log";
import { OptionValidationResult } from "domain/entities/OptionValidationResult";

export class OptionReport {
    async generateReport(options: OptionValidationResult[], csvPath: string): Promise<void> {
        const csvString = this.groupOptionsWithErrors(options);
        await fs.writeFile(csvPath, csvString, "utf-8");
        logger.info(`Report generated: ${csvPath}`);
    }

    private groupOptionsWithErrors(results: OptionValidationResult[]): string {
        const optionStringifier = createArrayCsvStringifier({
            header: [
                "Option Set ID",
                "Option Set Code",
                "Option Set Name",
                "Option Code",
                "Option Name",
                "Rule Type",
                "Rule Message",
            ],
        });

        const header = optionStringifier.getHeaderString();

        const rows = results.flatMap(({ option, optionSet, errors }) => {
            const allErrors = errors.map(error => {
                const row = optionStringifier.stringifyRecords([
                    [
                        optionSet.id,
                        optionSet.code ?? "",
                        optionSet.name,
                        option.code,
                        option.name,
                        error.type,
                        error.message,
                    ],
                ]);
                return row;
            });
            return allErrors.join("");
        });

        return [header, ...rows].join("");
    }
}
