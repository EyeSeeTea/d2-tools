import _ from "lodash";
import { createObjectCsvWriter } from "csv-writer";
import { Async } from "domain/entities/Async";
import { CategoryOption } from "domain/entities/CategoryOption";
import { Path } from "domain/entities/Base";
import { CategoryOptionSpreadsheetRepository } from "domain/repositories/CategoryOptionSpreadsheetRepository";

export class CategoryOptionSpreadsheetCsvRepository implements CategoryOptionSpreadsheetRepository {
    async saveReport(categoryOptions: CategoryOption[], path: Path): Async<void> {
        const csvWriter = createObjectCsvWriter({
            path: path,
            header: [
                {
                    id: "id",
                    title: "Id",
                },
                {
                    id: "name",
                    title: "Name",
                },
                {
                    id: "code",
                    title: "Code",
                },
            ],
        });

        const csvData = _(categoryOptions)
            .map(catOption => {
                return {
                    id: catOption.id,
                    code: catOption.code,
                    name: catOption.name,
                };
            })
            .value();

        await csvWriter.writeRecords(csvData);
    }
}
