import _ from "lodash";
import fs from "fs";
import CsvReadableStream from "csv-reader";

import { Async } from "domain/entities/Async";
import { NamedRef, Path } from "domain/entities/Base";
import { DanglingDataValue } from "domain/entities/DanglingDataValue";
import { DanglingDataValuesRepository } from "domain/repositories/DanglingDataValuesRepository";
import { Maybe } from "utils/ts-utils";
import { Report, ReportRow } from "./Report";
import { ReportsCsvRepository } from "./ReportsCsvRepository";
import { DataValuesMetadata } from "domain/entities/DataValue";
import { Id } from "@eyeseetea/d2-api";
import log from "utils/log";

export class DanglingDataValuesCsvRepository implements DanglingDataValuesRepository {
    async load(path: string): Async<DanglingDataValue[]> {
        return new Promise((resolve, reject) => {
            const danglingDataValues: DanglingDataValue[] = [];

            fs.createReadStream(path, "utf8")
                .pipe(new CsvReadableStream({ asObject: true, trim: true }))
                .on("data", rawRow => {
                    const row = rawRow as unknown as Row;
                    if (!row.dataElement) return;

                    const selector = getMaybeObj({
                        dataElement: idFromHumanRef(row.dataElement),
                        orgUnit: idFromHumanRef(row.orgUnit),
                        categoryOptionCombo: idFromHumanRef(row.categoryOptionCombo),
                        attributeOptionCombo: idFromHumanRef(row.attributeOptionCombo),
                    });

                    if (!selector) {
                        log.error(`Cannot get selector from row: ${JSON.stringify(rawRow)}`);
                        return;
                    }

                    const danglingDataValue: DanglingDataValue = {
                        dataValue: {
                            ...selector,
                            period: row.period,
                            value: row.value,
                            storedBy: row.storedBy,
                            created: row.created,
                            lastUpdated: row.lastUpdated,
                            followup: row.followup === "true",
                        },
                        dataSet: fromHumanRef(row.closestDataSet),
                        errors: row.errors.split(","),
                    };
                    danglingDataValues.push(danglingDataValue);
                })
                .on("error", msg => {
                    log.error(msg.message);
                    return reject(msg);
                })
                .on("end", () => {
                    return resolve(danglingDataValues);
                });
        });
    }

    async save(options: {
        dataValues: DanglingDataValue[];
        dataValuesMetadata: DataValuesMetadata;
        outputFile: Path;
    }): Async<void> {
        const { dataValues, dataValuesMetadata, outputFile } = options;

        const rows = dataValues.map((danglingDataValue): Row => {
            const dv = danglingDataValue.dataValue;
            const dataSet = danglingDataValue.dataSet;
            const metadata = dataValuesMetadata;

            return {
                orgUnit: toRefString(dv.orgUnit, dataValuesMetadata.orgUnits),
                dataElement: toRefString(dv.dataElement, dataValuesMetadata.dataElements),
                period: dv.period,
                categoryOptionCombo: toRefString(dv.categoryOptionCombo, metadata.categoryOptionCombos),
                attributeOptionCombo: toRefString(dv.attributeOptionCombo, metadata.categoryOptionCombos),
                created: dv.created,
                lastUpdated: dv.lastUpdated,
                storedBy: dv.storedBy,
                followup: dv.followup.toString(),
                value: dv.value,
                closestDataSet: humanRef(dataSet),
                errors: danglingDataValue.errors.join(", "),
            };
        });

        const report: Report<Column> = { name: outputFile, columns, rows };
        const reportsRepository = new ReportsCsvRepository();
        await reportsRepository.save(report);
    }
}

function humanRef(obj: Maybe<NamedRef>): string {
    return obj ? `${obj.name} [${obj.id}]` : "-";
}

function toRefString(id: Id, records: Record<Id, NamedRef>): string {
    return humanRef(records[id]);
}

function fromHumanRef(s: string): Maybe<NamedRef> {
    const match = s.match(/^(.*?)\s*\[(\w+)\]$/);
    if (!match) return;
    const [name = null, id = null] = match.slice(1);
    return name && id ? { id, name } : undefined;
}

function idFromHumanRef(s: Maybe<string>): Maybe<Id> {
    return s ? fromHumanRef(s)?.id : undefined;
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
    "errors",
] as const;

type Column = typeof columns[number];
type Row = ReportRow<Column>;

function getMaybeObj<Key extends string, Value>(obj: Record<Key, Maybe<Value>>): Maybe<Record<Key, Value>> {
    const allValuesPresent = _(obj).values().every();
    return allValuesPresent ? (obj as Record<Key, Value>) : undefined;
}
