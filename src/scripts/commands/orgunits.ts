// Commands related to organisation units manipulation.
// The generated sql files can be run for example with: d2-docker run-sql <file>

import _ from "lodash";
import { command, subcommands, flag, option, optional, string } from "cmd-ts";
import { HierarchyLevel, OrgUnitPath } from "scripts/common";
import { GenerateDeleteOrgUnitsActionUseCase } from "domain/usecases/GenerateDeleteOrgUnitsActionUseCase";
import { OrgUnitActionSqlRepository } from "data/OrgUnitActionSqlRepository";
import { OrgUnitAction } from "domain/OrgUnitAction";

export function getCommand() {
    const removeCommand = command({
        name: "remove",
        description: "Create a sql file that removes organisation units below a hierarchy level",
        args: {
            level: option({
                type: optional(HierarchyLevel),
                long: "level",
                description: "Maximum hierarchy level to keep",
            }),
            path: option({
                type: optional(OrgUnitPath),
                long: "path",
                description: "Path of the organisation unit to prune of its children",
            }),
            outputFile: option({
                type: optional(string),
                long: "output-file",
                description: "Name of the output file that will contain the sql commands",
            }),
            overwrite: flag({
                long: "overwrite",
                description: "Overwrite ouput file if exists",
            }),
        },
        handler: async args => {
            if (args.level === undefined && args.path === undefined) {
                console.error("At least one of --level or --path needed.");
                process.exit(1);
            }

            const orgUnitActionRepository = new OrgUnitActionSqlRepository();
            const action: OrgUnitAction = { type: "delete", ..._.pick(args, ["level", "path"]) };
            new GenerateDeleteOrgUnitsActionUseCase(orgUnitActionRepository).execute(action, args);
            process.stderr.write("Restart the DHIS2 instance after the SQL is applied\n");
            process.exit(0);
        },
    });

    return subcommands({
        name: "orgunits",
        cmds: {
            remove: removeCommand,
        },
    });
}
