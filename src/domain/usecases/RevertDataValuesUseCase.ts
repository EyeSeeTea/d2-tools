import _ from "lodash";
import fs from "fs";
import * as CsvWriter from "csv-writer";

import { Path, Username } from "domain/entities/Base";
import { compareDateTimeIso8601, DateTimeIso8601 } from "domain/entities/DateTime";
import { DataValuesRepository } from "domain/repositories/DataValuesRepository";
import { Id } from "types/d2-api";
import { Maybe } from "utils/ts-utils";
import { DataValueAudit, getDataValueAuditId } from "domain/entities/DataValueAudit";
import { DataValue, formatDataValue, getDataValueId } from "domain/entities/DataValue";
import log from "utils/log";

export class RevertDataValuesUseCase {
    constructor(private dataValuesRepository: DataValuesRepository) {}

    async execute(options: Options) {
        const { usernames } = options;

        log.debug(`Data sets: ${options.dataSetIds.join(", ")}`);
        log.debug(`Org units: ${options.orgUnitIds.join(", ")}`);
        log.debug(`Periods: ${options.periods.join(", ")}`);
        log.debug(`Usernames: ${options.usernames?.join(", ") || "-"}`);
        log.debug(`Date >= ${options.date}`);

        const filterByUsername = (username: string) => (usernames ? usernames.includes(username) : true);
        const filterByDate = (date: DateTimeIso8601) => compareDateTimeIso8601(date, options.date) !== "LT";

        const dataValues = await this.dataValuesRepository.get(options);
        const dataValuesAudit = await this.dataValuesRepository.getAudit(options);
        log.debug(`Data values: ${dataValues.length} - Audits: ${dataValuesAudit.length}`);

        const dataValuesFiltered = dataValues
            .filter(dv => filterByUsername(dv.storedBy))
            .filter(dv => filterByDate(dv.lastUpdated));

        const auditsByDataValueId = _.groupBy(dataValuesAudit, getDataValueAuditId);

        const updates = _(dataValuesFiltered)
            .map((dataValue): Maybe<Update> => {
                const dataValueId = getDataValueId(dataValue);
                const auditsForDataValue = _.sortBy(
                    auditsByDataValueId[dataValueId] || [],
                    audit => audit.created
                );

                const audit = _(auditsForDataValue).find(audit => {
                    return filterByDate(audit.created) && filterByUsername(audit.modifiedBy);
                });

                const auditPrev = _(auditsForDataValue).find(audit => {
                    return compareDateTimeIso8601(audit.created, options.date) === "LT";
                });

                if (_(auditsForDataValue).isEmpty()) {
                    log.warn(`No audits found for data value: ${formatDataValue(dataValue)}`);
                } else if (!audit) {
                    log.warn(`No reference audit found for data value: ${formatDataValue(dataValue)}`);
                } else {
                    const currentValue = dataValue.value;
                    const prevValue = audit.value;
                    const hasChanges = currentValue !== prevValue;
                    const dataValueUpdated: DataValue = {
                        ...dataValue,
                        value: prevValue,
                        storedBy: auditPrev?.modifiedBy || dataValue.storedBy,
                        lastUpdated: auditPrev?.created || dataValue.lastUpdated,
                    };
                    if (hasChanges) {
                        return { dataValueCurrent: dataValue, dataValueUpdated, audit, auditPrev };
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
            "lastUpdated",
            "storedBy",
            "value",
            "auditValue",
            "auditCreated",
            "auditModifiedBy",
        ] as const;

        type Header = typeof headers[number];
        type Row = Record<Header, string>;

        const createCsvWriter = CsvWriter.createObjectCsvWriter;
        const csvPath = options.outputFile + "-report.csv";

        const csvWriter = createCsvWriter({
            path: csvPath,
            header: headers.map(header => ({ id: header, title: header })),
        });

        const records = updates.map((update): Row => {
            const { dataValueCurrent: dv, audit } = update;

            return {
                orgUnit: dv.orgUnit,
                period: dv.period,
                dataElement: dv.dataElement,
                aoc: dv.attributeOptionCombo,
                coc: dv.categoryOptionCombo,
                lastUpdated: "'" + dv.lastUpdated,
                storedBy: dv.storedBy,
                value: dv.value,
                auditValue: audit.value,
                auditCreated: "'" + audit.created,
                auditModifiedBy: audit.modifiedBy,
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
        const dataValuesToPost = updates.map(update => update.dataValueUpdated);
        const { outputFile, url } = options;
        log.debug(`Data values with changes: ${dataValuesToPost.length}`);

        const payload = { dataValues: dataValuesToPost };
        const json = JSON.stringify(payload, null, 4);

        fs.writeFileSync(outputFile, json);
        log.info(`Written payload: ${outputFile}`);

        log.info(
            `Post command: curl -H 'Content-Type: application/json' '${url}/api/dataValueSets?force=true&skipAudit=true' -X POST -d@'${outputFile}' | jq`
        );
    }
}

interface Options {
    dataSetIds: Id[];
    orgUnitIds: Id[];
    periods: string[];
    url: string;
    date: DateTimeIso8601;
    outputFile: Path;
    usernames: Maybe<Username[]>;
}

interface Update {
    dataValueCurrent: DataValue;
    dataValueUpdated: DataValue;
    audit: DataValueAudit;
    auditPrev: Maybe<DataValueAudit>; // Used to override the storedBy/lastUpdated
}
