import fs from "fs";
import _ from "lodash";
import CsvReadableStream from "csv-reader";

import { Async } from "domain/entities/Async";
import { NamedRef, Path } from "domain/entities/Base";
import { DanglingDataValue } from "domain/entities/DanglingDataValue";
import { DanglingDataValuesRepository } from "domain/repositories/DanglingDataValuesRepository";
import { Maybe } from "utils/ts-utils";
import { Report, ReportRow } from "./Report";
import { ReportsCsvRepository } from "./ReportsCsvRepository";

export class DanglingDataValuesCsvRepository implements DanglingDataValuesRepository {
    async load(path: string): Async<DanglingDataValue[]> {
        return new Promise((resolve, reject) => {
            const danglingDataValues: DanglingDataValue[] = [];

            fs.createReadStream(path, "utf8")
                .pipe(new CsvReadableStream({ asObject: true, trim: true }))
                .on("data", rawRow => {
                    const row = rawRow as unknown as Row;
                    const danglingDataValue: DanglingDataValue = {
                        dataValue: {
                            dataElement: row.dataElement,
                            orgUnit: row.orgUnit,
                            period: row.period,
                            categoryOptionCombo: row.categoryOptionCombo,
                            attributeOptionCombo: row.attributeOptionCombo,
                            value: row.value,
                            storedBy: row.storedBy,
                            created: row.created,
                            lastUpdated: row.lastUpdated,
                            followup: row.followup === "true",
                        },
                        dataSet: fromStringRef(row.closestDataSet),
                        errors: row.errors.split(","),
                    };
                    danglingDataValues.push(danglingDataValue);
                })
                .on("error", msg => {
                    return reject(msg);
                })
                .on("end", () => {
                    return resolve(danglingDataValues);
                });
        });
    }

    async save(options: { dataValues: DanglingDataValue[]; outputFile: Path }): Async<void> {
        const { dataValues, outputFile } = options;

        const rows = dataValues.map((danglingDataValue): Row => {
            const dv = danglingDataValue.dataValue;
            const dataSet = danglingDataValue.dataSet;

            return {
                orgUnit: dv.orgUnit,
                dataElement: dv.dataElement,
                period: dv.period,
                categoryOptionCombo: dv.categoryOptionCombo,
                attributeOptionCombo: dv.attributeOptionCombo,
                created: formatTimestamp(dv.created),
                lastUpdated: formatTimestamp(dv.lastUpdated),
                storedBy: dv.storedBy,
                followup: dv.followup.toString(),
                value: dv.value,
                closestDataSet: toRefString(dataSet),
                errorsCount: danglingDataValue.errors.length.toString(),
                errors: danglingDataValue.errors.join(", "),
            };
        });

        const report: Report<Column> = { name: outputFile, columns, rows };
        const reportsRepository = new ReportsCsvRepository();
        reportsRepository.save(report);
    }
}

function formatTimestamp(ts: string) {
    const template = "YYYY-MM-DDTHH:MM:SS";
    return ts.slice(0, template.length);
}

function toRefString(obj: Maybe<NamedRef>): string {
    return obj ? `${obj.name} [${obj.id}]` : "-";
}

function fromStringRef(s: string): Maybe<NamedRef> {
    const [name = null, id = null] = s.match(/^(.*?)\s*\[(\w+)\]$/) || [];
    return name && id ? { id, name } : undefined;
}

const columns = [
    "orgUnit",
    "dataElement",
    "categoryOptionCombo",
    "attributeOptionCombo",
    "period",
    "created",
    "lastUpdated",
    "storedBy",
    "followup",
    "value",
    "closestDataSet",
    "errorsCount",
    "errors",
] as const;

type Column = typeof columns[number];

type Row = ReportRow<Column>;
