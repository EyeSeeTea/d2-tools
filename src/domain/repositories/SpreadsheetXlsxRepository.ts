import _ from "lodash";
import * as XLSX from "xlsx";

import { Async } from "domain/entities/Async";
import { ReadOptions, Row, Sheet, Spreadsheet, SpreadsheetDataSource } from "data/SpreadsheetsDataSource";

export class SpreadsheetXlsxDataSource implements SpreadsheetDataSource {
    async read(options: ReadOptions): Async<Spreadsheet> {
        const { inputFile, skipHidden } = options;
        const workbook = XLSX.readFile(inputFile);

        const sheets = _(workbook.Sheets)
            .toPairs()
            .map(([sheetName, worksheet]): Sheet => {
                const rows = XLSX.utils.sheet_to_json<Row<string>>(worksheet, { raw: true, skipHidden });

                return {
                    name: sheetName,
                    rows: rows.map(row => _.mapValues(row, cellValue => cellValue.trim())),
                };
            })
            .value();

        const spreadsheet: Spreadsheet = {
            name: inputFile,
            sheets,
        };

        return spreadsheet;
    }
}
