import { Async } from "domain/entities/Async";
import { OrgUnitAction } from "domain/OrgUnitAction";
import {
    OrgUnitActionRepository,
    OrgUnitActionRepositoryDeleteOptions,
} from "domain/repositories/OrgUnitActionRepository";
import fs from "fs";
import _ from "lodash";

export class OrgUnitActionSqlRepository implements OrgUnitActionRepository {
    async save(action: OrgUnitAction, options: OrgUnitActionRepositoryDeleteOptions): Async<void> {
        const conditions = [
            action.level !== undefined ? `hierarchylevel > ${action.level}` : undefined,
            action.path !== undefined ? `path LIKE '${action.path}/%'` : undefined,
        ];

        const whereCondition = _(conditions).compact().join(" AND ");
        const sqlTemplate = fs.readFileSync("./src/data/remove_orgunits.template.sql", "utf8");
        const sqlCommands = _.template(sqlTemplate)({ whereCondition });

        if (options.outputFile) {
            safeWrite(options.outputFile, sqlCommands, options.overwrite);
        } else {
            process.stdout.write(sqlCommands);
        }
    }
}

// Write to outputFile the given string str, unless the file exists.
function safeWrite(outputFile: string, str: string, overwrite: boolean) {
    if (!fs.existsSync(outputFile) || overwrite) {
        fs.writeFileSync(outputFile, str);
        console.debug(`Written: ${outputFile}`);
    } else {
        console.error(`ERROR. Output file already exists: ${outputFile}`);
        console.error("Use --overwrite if you want to overwrite it anyway.");
    }
}
