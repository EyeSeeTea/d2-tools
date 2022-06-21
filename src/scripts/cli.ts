import path from "path";
import { run, subcommands } from "cmd-ts";

import * as datasets from "./commands/datasets";
import * as programs from "./commands/programs";
import * as dataelements from "./commands/dataelements";

export function runCli() {
    const cliSubcommands = subcommands({
        name: path.basename(__filename),
        cmds: {
            datasets: datasets.getCommand(),
            programs: programs.getCommand(),
            dataelements: dataelements.getCommand(),
        },
    });

    const args = process.argv.slice(2);
    run(cliSubcommands, args);
}
