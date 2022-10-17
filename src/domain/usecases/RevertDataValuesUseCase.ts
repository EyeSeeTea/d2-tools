import _ from "lodash";
import fs from "fs";
import * as CsvWriter from "csv-writer";

import { Path, Username } from "domain/entities/Base";
import { compareDateTimeIso8601, DateTimeIso8601 } from "domain/entities/DateTime";
import { DataValuesRepository } from "domain/repositories/DataValuesRepository";
import { Id } from "types/d2-api";
import { Maybe } from "utils/ts-utils";
import { getDataValueIdForAudit } from "domain/entities/DataValueAudit";
import { DataValue, formatDataValue, getDataValueId } from "domain/entities/DataValue";
import log from "utils/log";

/* Revert data values for a selection of dataSets/orgUnits/periods + limit date

Steps:

    - Get data values (including deleted) and audits for the dataSets/orgUnits/periods selector given.
    - Filter out the ones with datetime before [options.date] (+ other optional filters).
    - For each of these data values:
        - Find the first invalid audit -> use value.
        - Find the last valid audit -> use auditType/value/storedBy/lastUpdated.
        - Build an updated data value by merging the existing data value with these two audit items.

Limitations: Only data values are used as source of data. Audits without corresponding data
values -soft-deleted values that were deleted- could also be used with some extra logic.

Output:
    - A JSON metadata payload.
    - A JSON metadata backup payload with current data values.
    - A CSV report.
*/

interface Options {
    dataSetIds: Id[];
    orgUnitIds: Id[];
    periods: string[];
    url: string;
    date: DateTimeIso8601;
    outputFile: Path;
    usernames: Maybe<Username[]>;
}

export class RevertDataValuesUseCase {
    constructor(private dataValuesRepository: DataValuesRepository) {}

    async execute(options: Options) {
        this.logOptions(options);

        const { usernames } = options;
        const filterByUsername = (username: string) => !usernames || usernames.includes(username);
        const filterByDate = (date: DateTimeIso8601) => compareDateTimeIso8601(date, options.date) !== "LT";

        const dataValues = await this.dataValuesRepository.get(options);
        const dataValuesAudit = await this.dataValuesRepository.getAudits(options);
        log.debug(`Data values: ${dataValues.length} - Audits: ${dataValuesAudit.length}`);

        const auditsByDataValueId = _.groupBy(dataValuesAudit, getDataValueIdForAudit);

        const dataValuesFiltered = dataValues.filter(
            dv => filterByUsername(dv.storedBy) && filterByDate(dv.lastUpdated)
        );

        log.debug(`Data values to analyze: ${dataValuesFiltered.length}`);

        const updates = _(dataValuesFiltered)
            .map((dataValue): Maybe<Update> => {
                const dataValueId = getDataValueId(dataValue);
                const auditsForDataValue = _.sortBy(auditsByDataValueId[dataValueId], audit => audit.created);

                const auditOfFirstInvalidChange = _(auditsForDataValue).find(audit => {
                    return filterByUsername(audit.modifiedBy) && filterByDate(audit.created);
                });

                const auditOfLastValidChange = _(auditsForDataValue)
                    .reverse()
                    .find(audit => compareDateTimeIso8601(audit.created, options.date) === "LT");

                if (_(auditsForDataValue).isEmpty()) {
                    log.warn(`No audits found for revertable data value: ${formatDataValue(dataValue)}`);
                } else {
                    const dataValueUpdated: DataValue = {
                        ..._.omit(dataValue, ["deleted"]),
                        value: auditOfFirstInvalidChange?.value ?? auditOfLastValidChange?.value ?? "",
                        storedBy: auditOfLastValidChange?.modifiedBy || dataValue.storedBy,
                        lastUpdated: auditOfLastValidChange?.created || dataValue.lastUpdated,
                        ...(auditOfLastValidChange?.auditType === "DELETE" ? { deleted: true } : {}),
                    };
                    if (!_.isEqual(dataValue, dataValueUpdated)) {
                        return { dataValueCurrent: dataValue, dataValueUpdated };
                    }
                }
            })
            .compact()
            .value();

        this.writeBackupFile(dataValues, options);
        this.writeReportFile(updates, options);
        this.writePayloadFile(updates, options);
    }

    private writeReportFile(updates: Update[], options: Options) {
        const headers = [
            "orgUnit",
            "period",
            "dataElement",
            "aoc",
            "coc",
            "value",
            "valueNew",
            "lastUpdated",
            "lastUpdatedNew",
            "storedBy",
            "storedByNew",
        ] as const;

        type Header = typeof headers[number];
        type Row = Record<Header, string>;

        const csvPath = options.outputFile + "-report.csv";
        const valueWithSuffix = (dv: DataValue) => (dv.deleted ? "(D) " : "") + dv.value;
        const header = headers.map(header => ({ id: header, title: header }));
        const csvWriter = CsvWriter.createObjectCsvWriter({ path: csvPath, header });

        const records = updates.map((update): Row => {
            const { dataValueCurrent: dv1, dataValueUpdated: dv2 } = update;

            return {
                orgUnit: dv1.orgUnit,
                period: dv1.period,
                dataElement: dv1.dataElement,
                aoc: dv1.attributeOptionCombo,
                coc: dv1.categoryOptionCombo,
                lastUpdated: "'" + dv1.lastUpdated,
                lastUpdatedNew: "'" + dv2.lastUpdated,
                storedBy: dv1.storedBy,
                storedByNew: dv2.storedBy,
                value: valueWithSuffix(dv1),
                valueNew: valueWithSuffix(dv2),
            };
        });

        csvWriter.writeRecords(records);

        log.debug(`Written CSV report: ${csvPath}`);
    }

    private writeBackupFile(dataValues: DataValue[], options: Options) {
        const payloadBackup = { dataValues };
        const jsonBackup = JSON.stringify(payloadBackup, null, 4);
        const backupFile = options.outputFile + "-backup.json";
        fs.writeFileSync(backupFile, jsonBackup);
        log.info(`Written backup: ${backupFile}`);
    }

    private writePayloadFile(updates: Update[], options: Options) {
        const { outputFile, url } = options;
        const dataValuesToPost = updates.map(update => update.dataValueUpdated);
        const payload = { dataValues: dataValuesToPost };
        const json = JSON.stringify(payload, null, 4);

        fs.writeFileSync(outputFile, json);
        log.info(`Written payload (${dataValuesToPost.length} data values): ${outputFile}`);
        const postUrl = `${url}/api/dataValueSets?force=true&skipAudit=true`;

        log.info(`Post example: curl -H 'Content-Type: application/json' -d@'${outputFile}' '${postUrl}'`);
    }

    private logOptions(options: Options) {
        log.debug(`Data sets: ${options.dataSetIds.join(", ")}`);
        log.debug(`Org units: ${options.orgUnitIds.join(", ")}`);
        log.debug(`Periods: ${options.periods.join(", ")}`);
        log.debug(`Usernames: ${options.usernames?.join(", ") || "-"}`);
        log.debug(`Date >= ${options.date}`);
    }
}

interface Update {
    dataValueCurrent: DataValue;
    dataValueUpdated: DataValue;
}
