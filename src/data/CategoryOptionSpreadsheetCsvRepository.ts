import _ from "lodash";
import { createObjectCsvWriter } from "csv-writer";
import { Async } from "domain/entities/Async";
import { CategoryOptionSpreadsheetRepository } from "domain/repositories/CategoryOptionSpreadsheetRepository";
import { CategoryOptionReport, CategoryOptionSpreadsheet } from "domain/entities/CategoryOptionSpreadsheet";
import { CategoryOption } from "domain/entities/CategoryOption";

export class CategoryOptionSpreadsheetCsvRepository implements CategoryOptionSpreadsheetRepository {
    async saveReport(options: CategoryOptionSpreadsheet): Async<void> {
        const csvWriter = createObjectCsvWriter({
            path: options.reportPath,
            header: [
                {
                    id: "filter",
                    title: "",
                },
                {
                    id: "missingGroups",
                    title: "Groups Not found",
                },
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

        const csvData = _(options.categoryOptions)
            .flatMap(catOptionReport => {
                return [
                    this.generateFilterRow(catOptionReport),
                    ...this.generateCategoryOptionsRows(catOptionReport),
                ];
            })
            .value();

        await csvWriter.writeRecords(csvData);
    }

    private generateFilterRow(catOptionReport: CategoryOptionReport) {
        return { filter: catOptionReport.filter, missingGroups: catOptionReport.missingGroups };
    }

    private generateCategoryOptionsRows(catOptionFilter: {
        filter: string;
        missingGroups: string;
        categoryOptions: CategoryOption[];
    }) {
        return catOptionFilter.categoryOptions.map(catOption => {
            return { id: catOption.id, code: catOption.code, name: catOption.name };
        });
    }
}
