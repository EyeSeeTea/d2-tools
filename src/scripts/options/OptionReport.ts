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
                "Option Name",
                "Option Code",
                "Option ID",
                "Option Set Name",
                "Option Set Code",
                "Option Set ID",
            ],
        });

        const rulesStringifier = createArrayCsvStringifier({ header: ["", "rule type", "rule message"] });
        const header = optionStringifier.getHeaderString();

        const rows = results.map(({ option, optionSet, errors }) => {
            const optionRow = optionStringifier.stringifyRecords([
                [option.name, option.code, option.id, optionSet.name, optionSet.code ?? "", optionSet.id],
            ]);
            const rulesHeader = rulesStringifier.getHeaderString();
            const ruleRows = rulesStringifier.stringifyRecords(errors.map(r => ["", r.type, r.message]));
            return `${optionRow}\n${rulesHeader}${ruleRows}\n`;
        });

        return [header, ...rows].join("");
    }
}
