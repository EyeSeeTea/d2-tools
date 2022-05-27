import path from "path";
import { run, subcommands } from "cmd-ts";

import * as datasets from "./commands/datasets";

export function runCli() {
    const cliSubcommands = subcommands({
        name: path.basename(__filename),
        cmds: { datasets: datasets.getCommand() },
    });

    const args = process.argv.slice(2);
    run(cliSubcommands, args);
}
