import _ from "lodash";
import * as XLSX from "xlsx";

import { Async } from "domain/entities/Async";
import { ReadOptions, Sheet, Spreadsheet, SpreadsheetDataSource } from "data/SpreadsheetsDataSource";

export class SpreadsheetXlsxDataSource implements SpreadsheetDataSource {
    async read(options: ReadOptions): Async<Spreadsheet> {
        const { inputFile, skipHidden } = options;
        const workbook = XLSX.readFile(inputFile);

        const sheets = _(workbook.Sheets)
            .toPairs()
            .map(([sheetName, worksheet]): Sheet => {
                const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(worksheet, {
                    raw: true,
                    skipHidden,
                });

                return {
                    name: sheetName,
                    rows: rows.map(row =>
                        _.mapValues(row, cellValue => {
                            return typeof cellValue === "string" ? cellValue.trim() : cellValue.toString();
                        })
                    ),
                };
            })
            .value();

        return { name: inputFile, sheets: sheets };
    }
}
