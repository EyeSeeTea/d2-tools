import { Path } from "domain/entities/Base";
import { UsernameRename } from "domain/entities/UsernameRename";
import fs from "fs";
import { UsernameRenameRepository } from "domain/repositories/UsernameRenameRepository";
import logger from "utils/log";
import _ from "lodash";
import * as psqlformat from "psqlformat";
//import sqlRename from "./sql/rename-usernames.sql?raw";

const sqlRename = "TODO";

export class UsernameRenameSqlRepository implements UsernameRenameRepository {
    constructor(private sqlFile: Path) {}

    async run(mapping: UsernameRename[], options: { dryRun: boolean }): Promise<void> {
        if (_.isEmpty(mapping)) {
            logger.warn("No usernames to rename");
            return;
        }

        logger.info(`Mapping: ${JSON.stringify(mapping)}`);
        const sqlMapping = getSqlForTemporalMappingTable(mapping);

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
