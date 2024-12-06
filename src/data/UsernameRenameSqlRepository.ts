import { Path } from "domain/entities/Base";
import { UsernameRename } from "domain/entities/UsernameRename";
import path from "path";
import fs from "fs";
import { UsernameRenameRepository } from "domain/repositories/UsernameRenameRepository";
import logger from "utils/log";
import _ from "lodash";
import * as psqlformat from "psqlformat";

export class UsernameRenameSqlRepository implements UsernameRenameRepository {
    constructor(private sqlFile: Path) {}

    async run(mapping: UsernameRename[], options: { dryRun: boolean }): Promise<void> {
        if (_.isEmpty(mapping)) {
            logger.warn("No usernames to rename");
            return;
        }

        const sqlMapping = getSqlForTemporalMappingTable(mapping);
        const sqlRename = getRenamingSql();

        const fullSql = [
            sqlMapping, //
            "BEGIN;",
            sqlRename,
            options.dryRun ? "ROLLBACK;" : "COMMIT;",
        ].join("\n");

        const formattedSql = formatSql(fullSql);
        logger.info(`Writing SQL: ${this.sqlFile}`);
        fs.writeFileSync(this.sqlFile, formattedSql + "\n");
    }
}

function getRenamingSql() {
    const sqlPath = path.join(__dirname, "./sql", "rename-usernames.sql");
    logger.debug(`Template SQL: ${sqlPath}`);
    const sqlRename = fs.readFileSync(sqlPath, "utf8");
    return sqlRename;
}

function getSqlForTemporalMappingTable(mapping: UsernameRename[]) {
    return `
        CREATE TEMP TABLE
            username_mapping (old_username TEXT, new_username TEXT);
        INSERT INTO
            username_mapping (old_username, new_username)
        VALUES
            ${mapping.map(x => `('${x.from}', '${x.to}')`).join(",\n")}
        ;
    `;
}

function formatSql(fullSql: string) {
    return psqlformat.formatSql(fullSql, {
        commaStart: false,
        commaEnd: true,
        commaBreak: false,
        formatType: true,
        noSpaceFunction: true,
    });
}
