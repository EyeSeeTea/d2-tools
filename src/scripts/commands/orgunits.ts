// Commands related to organisation units manipulation.
// The generated sql files can be run for example with: d2-docker run-sql <file>

import _ from "lodash";
import fs from "fs";
import { command, subcommands, flag, option, optional, string } from "cmd-ts";
import { HierarchyLevel, OrgUnitPath } from "scripts/common";

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

            const whereCondition = ([] as Array<string>)
                .concat(
                    args.level !== undefined ? [`hierarchylevel > ${args.level}`] : [],
                    args.path !== undefined ? [`path LIKE '${args.path}/%'`] : []
                )
                .join(" AND ");

            const sqlTemplate = fs.readFileSync("./src/data/remove_orgunits.template.sql", "utf8");
            const sqlCommands = _.template(sqlTemplate)({ whereCondition });

            if (args.outputFile) {
                safeWrite(args.outputFile, sqlCommands, args.overwrite);
            } else {
                process.stdout.write(sqlCommands);
            }

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

// Write to outputFile the given string str, unless the file exists.
function safeWrite(outputFile: string, str: string, overwrite: boolean) {
    if (!fs.existsSync(outputFile) || overwrite) {
        fs.writeFileSync(outputFile, str);
        console.log(`Written: ${outputFile}`);
    } else {
        console.error(`ERROR. Output file already exists: ${outputFile}`);
        console.error("Use --overwrite if you want to overwrite it anyway.");
    }
}
