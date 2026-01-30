import fs from "fs";
import CsvReadableStream from "csv-reader";

import { Ref } from "domain/entities/Base";
import { BulkDeleteDEsRepository } from "domain/repositories/BulkDeleteDEsRepository";

export class BulkDeleteDEsCsvRepository implements BulkDeleteDEsRepository {
    async getDEsToDelete(csv: string): Promise<string[]> {
        return new Promise((resolve, reject) => {
            const dataElementIds: string[] = [];

            fs.createReadStream(csv, "utf8")
                .pipe(new CsvReadableStream({ asObject: true, trim: true }))
                .on("data", rawRow => {
                    const row = rawRow as unknown as Ref;
                    if (!row.id) return;
                    if (row) {
                        dataElementIds.push(row.id);
                    }
                })
                .on("error", msg => {
                    return reject(msg);
                })
                .on("end", () => {
                    return resolve(dataElementIds);
                });
        });
    }
}