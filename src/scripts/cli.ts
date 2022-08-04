import path from "path";
import { run, subcommands } from "cmd-ts";

import * as datasets from "./commands/datasets";
import * as programs from "./commands/programs";
import * as translations from "./commands/translations";

export function runCli() {
    const cliSubcommands = subcommands({
        name: path.basename(__filename),
        cmds: {
            datasets: datasets.getCommand(),
            programs: programs.getCommand(),
            translations: translations.getCommand(),
        },
    });

    const args = process.argv.slice(2);
    run(cliSubcommands, args);
}
