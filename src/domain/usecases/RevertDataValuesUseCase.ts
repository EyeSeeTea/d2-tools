import _ from "lodash";
import fs from "fs";
import { Path, Username } from "domain/entities/Base";
import { compareDateTimeIso8601, DateTimeIso8601 } from "domain/entities/DateTime";
import { DataValuesRepository } from "domain/repositories/DataValuesRepository";
import { Id } from "types/d2-api";
import { Maybe } from "utils/ts-utils";
import { formatDataValueAudit, getDataValueAuditId } from "domain/entities/DataValueAudit";
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
        log.debug(`Date: ${options.date}`);

        const filterByUsername = (username: string) => (usernames ? usernames.includes(username) : true);
        const filterByDate = (date: DateTimeIso8601) => compareDateTimeIso8601(date, options.date) !== "LT";

        const dataValues = await this.dataValuesRepository.get(options);
        const dataValuesAudit = await this.dataValuesRepository.getAudit(options);
        log.debug(`Data values: ${dataValues.length} - Audits: ${dataValuesAudit.length}`);

        const dataValuesFiltered = dataValues
            .filter(dv => filterByUsername(dv.storedBy))
            .filter(dv => filterByDate(dv.lastUpdated));

        const auditsByDataValueId = _.groupBy(dataValuesAudit, getDataValueAuditId);

        const dataValuesToPost = _(dataValuesFiltered)
            .map((dataValue): Maybe<DataValue> => {
                const dataValueId = getDataValueId(dataValue);
                const auditsForDataValue = auditsByDataValueId[dataValueId] || [];
                const audit = _(auditsForDataValue)
                    .sortBy(audit => audit.created)
                    .find(audit => filterByDate(audit.created) && filterByUsername(audit.modifiedBy));

                if (_(auditsForDataValue).isEmpty()) {
                    log.warn(`No audits found for data value: ${formatDataValue(dataValue)}`);
                } else if (!audit) {
                    log.warn(`No reference audit found for data value: ${formatDataValue(dataValue)}`);
                } else {
                    const currentValue = dataValue.value;
                    const prevValue = audit.value;
                    const hasChanges = currentValue !== prevValue;
                    const msgs = [
                        `Audit found:`,
                        `  - dataValue: ${formatDataValue(dataValue)}`,
                        `  - audit: ${formatDataValueAudit(audit)}`,
                        hasChanges ? `  - change: ${currentValue} -> ${prevValue}` : "  - nochange",
                    ];
                    msgs.forEach(msg => log.debug(msg));

                    return hasChanges ? { ...dataValue, value: prevValue } : undefined;
                }
            })
            .compact()
            .value();

        this.writeFile(dataValues, dataValuesToPost, options);
    }

    private writeFile(dataValues: DataValue[], dataValuesToPost: DataValue[], options: Options) {
        const { outputFile, url } = options;
        log.debug(`Data values with changes: ${dataValuesToPost.length}`);

        const payloadBackup = { dataValues };
        const jsonBackup = JSON.stringify(payloadBackup, null, 4);
        const backupFile = outputFile + "-backup.json";
        fs.writeFileSync(backupFile, jsonBackup);
        log.info(`Written backup: ${backupFile}`);

        const payload = { dataValues: dataValuesToPost };
        const json = JSON.stringify(payload, null, 4);
        fs.writeFileSync(outputFile, json);
        log.info(`Written: ${outputFile}`);

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
