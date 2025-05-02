import { OptionValidationResult } from "domain/entities/OptionValidationResult";
import _ from "lodash";

function escapeCsv(value: string): string {
    return `"${value.replace(/"/g, '""')}"`;
}

export function generateOptionReport(results: OptionValidationResult[]): string {
    const globalHeaders = [
        "Option Name",
        "Option Code",
        "Option ID",
        "Option Set Name",
        "Option Set Code",
        "Option Set ID",
    ]
        .map(escapeCsv)
        .join(",");

    const rows = _(results)
        .map(({ option, optionSet, rules }) => {
            const optionRow = [
                option.name,
                option.code,
                option.id,
                optionSet.name,
                optionSet.code ?? "",
                optionSet.id,
            ]
                .map(escapeCsv)
                .join(",");

            const spaceBetweenOptionAndRules = "";

            const ruleHeaders = ["", "rule type", "rule message"].map(escapeCsv).join(",");
            const ruleRows = rules.map(({ type, message }) => ["", type, message].map(escapeCsv).join(","));

            const spaceBetweenOptions = "";

            return [optionRow, spaceBetweenOptionAndRules, ruleHeaders, ...ruleRows, spaceBetweenOptions];
        })
        .flatten()
        .value();

    return [globalHeaders, ...rows].join("\n");
}
